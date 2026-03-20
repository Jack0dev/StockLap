package com.stocklab.service;

import com.stocklab.dto.*;
import com.stocklab.model.*;
import com.stocklab.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TradeService {

    private final UserRepository userRepository;
    private final StockRepository stockRepository;
    private final TransactionRepository transactionRepository;
    private final PortfolioRepository portfolioRepository;

    /**
     * Mua cổ phiếu
     */
    @Transactional
    public ApiResponse<TradeResponse> buyStock(String username, TradeRequest request) {
        // 1. Tìm user
        User user = userRepository.findByUsername(username)
                .orElse(null);
        if (user == null) {
            return ApiResponse.error("Không tìm thấy người dùng");
        }

        // 2. Tìm stock
        Stock stock = stockRepository.findByTicker(request.getTicker().toUpperCase())
                .orElse(null);
        if (stock == null) {
            return ApiResponse.error("Không tìm thấy cổ phiếu: " + request.getTicker());
        }

        // 3. Tính tổng tiền
        BigDecimal price = stock.getCurrentPrice();
        BigDecimal totalAmount = price.multiply(BigDecimal.valueOf(request.getQuantity()));

        // 4. Validate số dư
        if (user.getBalance().compareTo(totalAmount) < 0) {
            return ApiResponse.error("Số dư không đủ! Cần " +
                    formatCurrency(totalAmount) + " VND, hiện có " +
                    formatCurrency(user.getBalance()) + " VND");
        }

        // 5. Trừ balance
        user.setBalance(user.getBalance().subtract(totalAmount));
        userRepository.save(user);

        // 6. Tạo Transaction
        Transaction transaction = Transaction.builder()
                .user(user)
                .stock(stock)
                .type(TransactionType.BUY)
                .quantity(request.getQuantity())
                .price(price)
                .totalAmount(totalAmount)
                .build();
        transactionRepository.save(transaction);

        // 7. Cập nhật Portfolio
        Portfolio portfolio = portfolioRepository.findByUserIdAndStockId(user.getId(), stock.getId())
                .orElse(null);

        if (portfolio != null) {
            // Đã có → tính giá trung bình mới
            BigDecimal oldTotal = portfolio.getAvgBuyPrice()
                    .multiply(BigDecimal.valueOf(portfolio.getQuantity()));
            int newQuantity = portfolio.getQuantity() + request.getQuantity();
            BigDecimal newAvgPrice = oldTotal.add(totalAmount)
                    .divide(BigDecimal.valueOf(newQuantity), 2, RoundingMode.HALF_UP);

            portfolio.setQuantity(newQuantity);
            portfolio.setAvgBuyPrice(newAvgPrice);
        } else {
            // Chưa có → tạo mới
            portfolio = Portfolio.builder()
                    .user(user)
                    .stock(stock)
                    .quantity(request.getQuantity())
                    .avgBuyPrice(price)
                    .build();
        }
        portfolioRepository.save(portfolio);

        // 8. Build response
        TradeResponse response = TradeResponse.builder()
                .transactionId(transaction.getId())
                .ticker(stock.getTicker())
                .companyName(stock.getCompanyName())
                .type("BUY")
                .quantity(request.getQuantity())
                .price(price)
                .totalAmount(totalAmount)
                .balanceAfter(user.getBalance())
                .timestamp(transaction.getCreatedAt())
                .build();

        return ApiResponse.success("Mua " + request.getQuantity() + " CP " +
                stock.getTicker() + " thành công!", response);
    }

    /**
     * Bán cổ phiếu
     */
    @Transactional
    public ApiResponse<TradeResponse> sellStock(String username, TradeRequest request) {
        // 1. Tìm user
        User user = userRepository.findByUsername(username)
                .orElse(null);
        if (user == null) {
            return ApiResponse.error("Không tìm thấy người dùng");
        }

        // 2. Tìm stock
        Stock stock = stockRepository.findByTicker(request.getTicker().toUpperCase())
                .orElse(null);
        if (stock == null) {
            return ApiResponse.error("Không tìm thấy cổ phiếu: " + request.getTicker());
        }

        // 3. Kiểm tra Portfolio
        Portfolio portfolio = portfolioRepository.findByUserIdAndStockId(user.getId(), stock.getId())
                .orElse(null);
        if (portfolio == null || portfolio.getQuantity() < request.getQuantity()) {
            int holding = (portfolio != null) ? portfolio.getQuantity() : 0;
            return ApiResponse.error("Không đủ cổ phiếu để bán! Đang giữ " +
                    holding + " CP " + stock.getTicker());
        }

        // 4. Tính tổng tiền
        BigDecimal price = stock.getCurrentPrice();
        BigDecimal totalAmount = price.multiply(BigDecimal.valueOf(request.getQuantity()));

        // 5. Cộng balance
        user.setBalance(user.getBalance().add(totalAmount));
        userRepository.save(user);

        // 6. Tạo Transaction
        Transaction transaction = Transaction.builder()
                .user(user)
                .stock(stock)
                .type(TransactionType.SELL)
                .quantity(request.getQuantity())
                .price(price)
                .totalAmount(totalAmount)
                .build();
        transactionRepository.save(transaction);

        // 7. Cập nhật Portfolio
        int remainingQuantity = portfolio.getQuantity() - request.getQuantity();
        if (remainingQuantity == 0) {
            portfolioRepository.delete(portfolio);
        } else {
            portfolio.setQuantity(remainingQuantity);
            portfolioRepository.save(portfolio);
        }

        // 8. Build response
        TradeResponse response = TradeResponse.builder()
                .transactionId(transaction.getId())
                .ticker(stock.getTicker())
                .companyName(stock.getCompanyName())
                .type("SELL")
                .quantity(request.getQuantity())
                .price(price)
                .totalAmount(totalAmount)
                .balanceAfter(user.getBalance())
                .timestamp(transaction.getCreatedAt())
                .build();

        return ApiResponse.success("Bán " + request.getQuantity() + " CP " +
                stock.getTicker() + " thành công!", response);
    }

    /**
     * Lịch sử giao dịch
     */
    public ApiResponse<Page<TransactionResponse>> getTransactionHistory(
            String username, Pageable pageable, String type) {

        User user = userRepository.findByUsername(username)
                .orElse(null);
        if (user == null) {
            return ApiResponse.error("Không tìm thấy người dùng");
        }

        Page<TransactionResponse> transactions;
        if (type != null && !type.isEmpty()) {
            try {
                TransactionType txType = TransactionType.valueOf(type.toUpperCase());
                transactions = transactionRepository
                        .findByUserIdAndTypeOrderByCreatedAtDesc(user.getId(), txType, pageable)
                        .map(this::toTransactionResponse);
            } catch (IllegalArgumentException e) {
                return ApiResponse.error("Loại giao dịch không hợp lệ: " + type);
            }
        } else {
            transactions = transactionRepository
                    .findByUserIdOrderByCreatedAtDesc(user.getId(), pageable)
                    .map(this::toTransactionResponse);
        }

        return ApiResponse.success("Lấy lịch sử giao dịch thành công", transactions);
    }

    /**
     * Danh mục đầu tư
     */
    public ApiResponse<List<PortfolioResponse>> getPortfolio(String username) {
        User user = userRepository.findByUsername(username)
                .orElse(null);
        if (user == null) {
            return ApiResponse.error("Không tìm thấy người dùng");
        }

        List<PortfolioResponse> portfolio = portfolioRepository.findByUserId(user.getId())
                .stream()
                .map(this::toPortfolioResponse)
                .collect(Collectors.toList());

        return ApiResponse.success("Lấy danh mục đầu tư thành công", portfolio);
    }

    // ===== Helper Methods =====

    private TransactionResponse toTransactionResponse(Transaction tx) {
        return TransactionResponse.builder()
                .id(tx.getId())
                .ticker(tx.getStock().getTicker())
                .companyName(tx.getStock().getCompanyName())
                .type(tx.getType().name())
                .quantity(tx.getQuantity())
                .price(tx.getPrice())
                .totalAmount(tx.getTotalAmount())
                .createdAt(tx.getCreatedAt())
                .build();
    }

    private PortfolioResponse toPortfolioResponse(Portfolio p) {
        Stock stock = p.getStock();
        BigDecimal currentPrice = stock.getCurrentPrice();
        BigDecimal totalValue = currentPrice.multiply(BigDecimal.valueOf(p.getQuantity()));
        BigDecimal profitLoss = currentPrice.subtract(p.getAvgBuyPrice())
                .multiply(BigDecimal.valueOf(p.getQuantity()));

        double profitLossPercent = 0.0;
        if (p.getAvgBuyPrice().compareTo(BigDecimal.ZERO) > 0) {
            profitLossPercent = currentPrice.subtract(p.getAvgBuyPrice())
                    .divide(p.getAvgBuyPrice(), 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .doubleValue();
        }

        return PortfolioResponse.builder()
                .id(p.getId())
                .ticker(stock.getTicker())
                .companyName(stock.getCompanyName())
                .exchange(stock.getExchange())
                .quantity(p.getQuantity())
                .avgBuyPrice(p.getAvgBuyPrice())
                .currentPrice(currentPrice)
                .totalValue(totalValue)
                .profitLoss(profitLoss)
                .profitLossPercent(profitLossPercent)
                .build();
    }

    private String formatCurrency(BigDecimal amount) {
        return String.format("%,.0f", amount);
    }
}
