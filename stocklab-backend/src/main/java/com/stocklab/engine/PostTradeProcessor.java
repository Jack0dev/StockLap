package com.stocklab.engine;

import com.stocklab.model.*;
import com.stocklab.repository.*;
import com.stocklab.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Xử lý hậu khớp lệnh:
 * 1. Tạo Transaction (BUY + SELL)
 * 2. Cập nhật Balance + LockedBalance
 * 3. Cập nhật Portfolio + AvgBuyPrice
 * 4. Cập nhật Stock Price
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PostTradeProcessor {

    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final PortfolioRepository portfolioRepository;
    private final StockRepository stockRepository;
    private final OrderRepository orderRepository;

    /**
     * Xử lý 1 MatchResult sau khi khớp lệnh
     */
    @Transactional
    public void process(MatchResult matchResult) {
        // Reload entities từ DB để tránh detached entity
        Order buyOrder = orderRepository.findById(matchResult.getBuyOrder().getId()).orElseThrow();
        Order sellOrder = orderRepository.findById(matchResult.getSellOrder().getId()).orElseThrow();
        BigDecimal matchPrice = matchResult.getMatchPrice();
        int matchQty = matchResult.getMatchQuantity();
        BigDecimal totalAmount = matchPrice.multiply(BigDecimal.valueOf(matchQty));

        User buyer = userRepository.findById(buyOrder.getUser().getId()).orElseThrow();
        User seller = userRepository.findById(sellOrder.getUser().getId()).orElseThrow();
        Stock stock = stockRepository.findById(buyOrder.getStock().getId()).orElseThrow();

        // 1. Tạo Transaction cho cả 2 bên
        createTransactions(buyer, seller, stock, matchQty, matchPrice, totalAmount);

        // 2. Cập nhật Balance
        updateBalances(buyer, seller, totalAmount);

        // 3. Cập nhật Portfolio
        updateBuyerPortfolio(buyer, stock, matchQty, matchPrice, totalAmount);
        updateSellerPortfolio(seller, stock, matchQty);

        // 4. Cập nhật Stock Price
        updateStockPrice(stock, matchPrice, matchQty);

        log.info("[POST-TRADE] {} {}x{} @ {} | Buyer={} Seller={}",
                stock.getTicker(), matchQty, matchPrice,
                totalAmount, buyer.getUsername(), seller.getUsername());
    }

    /**
     * Tạo 2 Transaction records (BUY + SELL)
     */
    private void createTransactions(User buyer, User seller, Stock stock,
                                     int quantity, BigDecimal price, BigDecimal totalAmount) {
        // BUY transaction
        Transaction buyTx = Transaction.builder()
                .user(buyer)
                .stock(stock)
                .type(TransactionType.BUY)
                .quantity(quantity)
                .price(price)
                .totalAmount(totalAmount)
                .build();
        transactionRepository.save(buyTx);

        // SELL transaction
        Transaction sellTx = Transaction.builder()
                .user(seller)
                .stock(stock)
                .type(TransactionType.SELL)
                .quantity(quantity)
                .price(price)
                .totalAmount(totalAmount)
                .build();
        transactionRepository.save(sellTx);
    }

    /**
     * Cập nhật Balance:
     * - Buyer: trừ tiền thật (balance) + giảm lockedBalance
     * - Seller: cộng tiền
     */
    private void updateBalances(User buyer, User seller, BigDecimal totalAmount) {
        // Buyer: balance -= totalAmount, lockedBalance -= totalAmount
        buyer.setBalance(buyer.getBalance().subtract(totalAmount));
        buyer.setLockedBalance(buyer.getLockedBalance().subtract(totalAmount));
        userRepository.save(buyer);

        // Seller: balance += totalAmount
        seller.setBalance(seller.getBalance().add(totalAmount));
        userRepository.save(seller);
    }

    /**
     * Cập nhật Portfolio cho Buyer:
     * - Chưa có → tạo mới
     * - Đã có → cập nhật quantity + avgBuyPrice
     */
    private void updateBuyerPortfolio(User buyer, Stock stock, int matchQty,
                                       BigDecimal matchPrice, BigDecimal totalAmount) {
        Portfolio portfolio = portfolioRepository
                .findByUserIdAndStockId(buyer.getId(), stock.getId())
                .orElse(null);

        if (portfolio != null) {
            // Đã có → tính avgBuyPrice mới
            BigDecimal oldTotal = portfolio.getAvgBuyPrice()
                    .multiply(BigDecimal.valueOf(portfolio.getQuantity()));
            int newQuantity = portfolio.getQuantity() + matchQty;
            BigDecimal newAvgPrice = oldTotal.add(totalAmount)
                    .divide(BigDecimal.valueOf(newQuantity), 2, RoundingMode.HALF_UP);

            portfolio.setQuantity(newQuantity);
            portfolio.setAvgBuyPrice(newAvgPrice);
        } else {
            // Chưa có → tạo mới
            portfolio = Portfolio.builder()
                    .user(buyer)
                    .stock(stock)
                    .quantity(matchQty)
                    .avgBuyPrice(matchPrice)
                    .build();
        }
        portfolioRepository.save(portfolio);
    }

    /**
     * Cập nhật Portfolio cho Seller:
     * - Giảm quantity + lockedQuantity
     * - Nếu hết CP → xóa portfolio
     */
    private void updateSellerPortfolio(User seller, Stock stock, int matchQty) {
        Portfolio portfolio = portfolioRepository
                .findByUserIdAndStockId(seller.getId(), stock.getId())
                .orElse(null);

        if (portfolio == null) {
            log.warn("[POST-TRADE] Seller {} không có portfolio cho {}", seller.getUsername(), stock.getTicker());
            return;
        }

        int remainingQty = portfolio.getQuantity() - matchQty;
        portfolio.setLockedQuantity(portfolio.getLockedQuantity() - matchQty);

        if (remainingQty <= 0) {
            portfolioRepository.delete(portfolio);
        } else {
            portfolio.setQuantity(remainingQty);
            portfolioRepository.save(portfolio);
        }
    }

    /**
     * Cập nhật giá cổ phiếu:
     * - currentPrice = matchPrice
     * - highPrice nếu matchPrice cao hơn
     * - lowPrice nếu matchPrice thấp hơn
     * - volume += matchQty
     */
    private void updateStockPrice(Stock stock, BigDecimal matchPrice, int matchQty) {
        stock.setCurrentPrice(matchPrice);

        if (matchPrice.compareTo(stock.getHighPrice()) > 0) {
            stock.setHighPrice(matchPrice);
        }
        if (matchPrice.compareTo(stock.getLowPrice()) < 0) {
            stock.setLowPrice(matchPrice);
        }

        // Cập nhật change & changePercent theo referencePrice
        BigDecimal refPrice = stock.getReferencePrice();
        if (refPrice != null && refPrice.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal change = matchPrice.subtract(refPrice);
            stock.setChange(change);
            stock.setChangePercent(
                change.divide(refPrice, 4, RoundingMode.HALF_UP)
                      .multiply(BigDecimal.valueOf(100))
                      .doubleValue()
            );
        }

        stock.setVolume(stock.getVolume() + matchQty);
        stockRepository.save(stock);
    }
}
