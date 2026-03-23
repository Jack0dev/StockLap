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
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final UserRepository userRepository;
    private final StockRepository stockRepository;
    private final OrderRepository orderRepository;
    private final PortfolioRepository portfolioRepository;

    /**
     * Đặt lệnh mua/bán
     */
    @Transactional
    public ApiResponse<OrderResponse> placeOrder(String username, OrderRequest request) {
        // 1. Tìm user
        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) {
            return ApiResponse.error("Không tìm thấy người dùng");
        }

        // 2. Tìm stock
        Stock stock = stockRepository.findByTicker(request.getTicker().toUpperCase()).orElse(null);
        if (stock == null) {
            return ApiResponse.error("Không tìm thấy cổ phiếu: " + request.getTicker());
        }

        // 3. Parse enums
        OrderSide side;
        try {
            side = OrderSide.valueOf(request.getSide().toUpperCase());
        } catch (IllegalArgumentException e) {
            return ApiResponse.error("Loại lệnh không hợp lệ: " + request.getSide() + ". Chỉ chấp nhận BUY hoặc SELL");
        }

        OrderType orderType;
        try {
            orderType = OrderType.valueOf(request.getOrderType().toUpperCase());
        } catch (IllegalArgumentException e) {
            return ApiResponse
                    .error("Kiểu lệnh không hợp lệ: " + request.getOrderType() + ". Chỉ chấp nhận MARKET hoặc LIMIT");
        }

        // 4. Validate price cho LIMIT order
        BigDecimal price;
        if (orderType == OrderType.LIMIT) {
            if (request.getPrice() == null || request.getPrice().compareTo(BigDecimal.ZERO) <= 0) {
                return ApiResponse.error("Lệnh LIMIT bắt buộc phải có giá > 0");
            }
            price = request.getPrice();
        } else {
            // MARKET order: dùng giá hiện tại
            price = stock.getCurrentPrice();
        }

        // 5. Validate số lượng
        if (request.getQuantity() == null || request.getQuantity() <= 0) {
            return ApiResponse.error("Số lượng phải lớn hơn 0");
        }

        // 6. Validate & Lock tài sản
        if (side == OrderSide.BUY) {
            return placeBuyOrder(user, stock, orderType, price, request.getQuantity());
        } else {
            return placeSellOrder(user, stock, orderType, price, request.getQuantity());
        }
    }

    /**
     * Xử lý đặt lệnh MUA
     */
    private ApiResponse<OrderResponse> placeBuyOrder(User user, Stock stock, OrderType orderType,
            BigDecimal price, int quantity) {
        BigDecimal totalCost = price.multiply(BigDecimal.valueOf(quantity));
        BigDecimal availableBalance = user.getAvailableBalance();

        // Validate số dư khả dụng
        if (availableBalance.compareTo(totalCost) < 0) {
            return ApiResponse.error("Số dư khả dụng không đủ! Cần " +
                    formatCurrency(totalCost) + " VND, khả dụng: " +
                    formatCurrency(availableBalance) + " VND");
        }

        // Lock tiền
        user.setLockedBalance(user.getLockedBalance().add(totalCost));
        userRepository.save(user);

        // Tạo Order
        Order order = Order.builder()
                .user(user)
                .stock(stock)
                .side(OrderSide.BUY)
                .orderType(orderType)
                .quantity(quantity)
                .price(price)
                .status(OrderStatus.PENDING)
                .build();
        orderRepository.save(order);

        return ApiResponse.success("Đặt lệnh MUA " + quantity + " CP " +
                stock.getTicker() + " thành công! Đang chờ khớp lệnh.", toOrderResponse(order));
    }

    /**
     * Xử lý đặt lệnh BÁN
     */
    private ApiResponse<OrderResponse> placeSellOrder(User user, Stock stock, OrderType orderType,
            BigDecimal price, int quantity) {
        // Tìm portfolio
        Portfolio portfolio = portfolioRepository.findByUserIdAndStockId(user.getId(), stock.getId())
                .orElse(null);

        int availableQty = (portfolio != null) ? portfolio.getAvailableQuantity() : 0;

        // Validate CP khả dụng
        if (availableQty < quantity) {
            return ApiResponse.error("Không đủ cổ phiếu để bán! Đang có " +
                    availableQty + " CP " + stock.getTicker() + " khả dụng");
        }

        // Lock CP
        portfolio.setLockedQuantity(portfolio.getLockedQuantity() + quantity);
        portfolioRepository.save(portfolio);

        // Tạo Order
        Order order = Order.builder()
                .user(user)
                .stock(stock)
                .side(OrderSide.SELL)
                .orderType(orderType)
                .quantity(quantity)
                .price(price)
                .status(OrderStatus.PENDING)
                .build();
        orderRepository.save(order);

        return ApiResponse.success("Đặt lệnh BÁN " + quantity + " CP " +
                stock.getTicker() + " thành công! Đang chờ khớp lệnh.", toOrderResponse(order));
    }

    /**
     * Lấy danh sách lệnh của user (pagination)
     */
    public ApiResponse<Page<OrderResponse>> getMyOrders(String username, Pageable pageable, String status) {
        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) {
            return ApiResponse.error("Không tìm thấy người dùng");
        }

        Page<OrderResponse> orders;
        if (status != null && !status.isEmpty()) {
            try {
                OrderStatus orderStatus = OrderStatus.valueOf(status.toUpperCase());
                orders = orderRepository
                        .findByUserIdAndStatusOrderByCreatedAtDesc(user.getId(), orderStatus, pageable)
                        .map(this::toOrderResponse);
            } catch (IllegalArgumentException e) {
                return ApiResponse.error("Trạng thái lệnh không hợp lệ: " + status);
            }
        } else {
            orders = orderRepository
                    .findByUserIdOrderByCreatedAtDesc(user.getId(), pageable)
                    .map(this::toOrderResponse);
        }

        return ApiResponse.success("Lấy danh sách lệnh thành công", orders);
    }

    /**
     * Lấy chi tiết 1 lệnh
     */
    public ApiResponse<OrderResponse> getOrderDetail(String username, Long orderId) {
        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) {
            return ApiResponse.error("Không tìm thấy người dùng");
        }

        Order order = orderRepository.findById(orderId).orElse(null);
        if (order == null) {
            return ApiResponse.error("Không tìm thấy lệnh #" + orderId);
        }

        // Chỉ cho phép xem lệnh của chính mình
        if (!order.getUser().getId().equals(user.getId())) {
            return ApiResponse.error("Bạn không có quyền xem lệnh này");
        }

        return ApiResponse.success("OK", toOrderResponse(order));
    }

    /**
     * Hủy lệnh — chỉ cho phép PENDING hoặc PARTIAL
     */
    @Transactional
    public ApiResponse<OrderResponse> cancelOrder(String username, Long orderId) {
        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) {
            return ApiResponse.error("Không tìm thấy người dùng");
        }

        Order order = orderRepository.findById(orderId).orElse(null);
        if (order == null) {
            return ApiResponse.error("Không tìm thấy lệnh #" + orderId);
        }

        // Chỉ cho phép hủy lệnh của chính mình
        if (!order.getUser().getId().equals(user.getId())) {
            return ApiResponse.error("Bạn không có quyền hủy lệnh này");
        }

        // Chỉ hủy được PENDING hoặc PARTIAL
        if (!order.isCancellable()) {
            return ApiResponse.error("Không thể hủy lệnh ở trạng thái: " + order.getStatus());
        }

        int remainingQty = order.getRemainingQuantity();

        // Unlock tài sản theo remaining quantity
        if (order.getSide() == OrderSide.BUY) {
            // Hoàn tiền locked = remaining * price
            BigDecimal refund = order.getPrice().multiply(BigDecimal.valueOf(remainingQty));
            user.setLockedBalance(user.getLockedBalance().subtract(refund));
            userRepository.save(user);
        } else {
            // Hoàn CP locked
            Portfolio portfolio = portfolioRepository
                    .findByUserIdAndStockId(user.getId(), order.getStock().getId())
                    .orElse(null);
            if (portfolio != null) {
                portfolio.setLockedQuantity(portfolio.getLockedQuantity() - remainingQty);
                portfolioRepository.save(portfolio);
            }
        }

        order.setStatus(OrderStatus.CANCELLED);
        orderRepository.save(order);

        return ApiResponse.success(
                "Đã hủy lệnh #" + orderId + " thành công! Hoàn " + remainingQty +
                        (order.getSide() == OrderSide.BUY ? " phần tiền đã lock" : " CP đã lock"),
                toOrderResponse(order));
    }

    /**
     * Lấy Order Book cho 1 cổ phiếu — group lệnh PENDING/PARTIAL theo giá
     */
    public ApiResponse<OrderBookResponse> getOrderBook(String ticker) {
        Stock stock = stockRepository.findByTicker(ticker.toUpperCase()).orElse(null);
        if (stock == null) {
            return ApiResponse.error("Không tìm thấy cổ phiếu: " + ticker);
        }

        List<OrderStatus> activeStatuses = List.of(OrderStatus.PENDING, OrderStatus.PARTIAL);

        // Lấy tất cả lệnh BUY đang active
        List<Order> buyOrders = orderRepository.findByStockIdAndSideAndStatusIn(
                stock.getId(), OrderSide.BUY, activeStatuses);

        // Lấy tất cả lệnh SELL đang active
        List<Order> sellOrders = orderRepository.findByStockIdAndSideAndStatusIn(
                stock.getId(), OrderSide.SELL, activeStatuses);

        // Group BUY theo giá → bids (giá giảm dần)
        List<OrderBookResponse.OrderBookEntry> bids = groupByPrice(buyOrders, true);

        // Group SELL theo giá → asks (giá tăng dần)
        List<OrderBookResponse.OrderBookEntry> asks = groupByPrice(sellOrders, false);

        OrderBookResponse orderBook = OrderBookResponse.builder()
                .ticker(stock.getTicker())
                .companyName(stock.getCompanyName())
                .bids(bids)
                .asks(asks)
                .build();

        return ApiResponse.success("OK", orderBook);
    }

    /**
     * Group danh sách Order theo price → tính tổng remaining quantity + đếm số lệnh
     */
    private List<OrderBookResponse.OrderBookEntry> groupByPrice(List<Order> orders, boolean descending) {
        // Group theo price
        java.util.Map<BigDecimal, List<Order>> grouped = orders.stream()
                .collect(java.util.stream.Collectors.groupingBy(Order::getPrice));

        // Chuyển thành OrderBookEntry
        List<OrderBookResponse.OrderBookEntry> entries = grouped.entrySet().stream()
                .map(entry -> OrderBookResponse.OrderBookEntry.builder()
                        .price(entry.getKey())
                        .totalQuantity(entry.getValue().stream()
                                .mapToInt(Order::getRemainingQuantity)
                                .sum())
                        .orderCount(entry.getValue().size())
                        .build())
                .collect(java.util.stream.Collectors.toList());

        // Sắp xếp: BUY giá giảm dần, SELL giá tăng dần
        if (descending) {
            entries.sort((a, b) -> b.getPrice().compareTo(a.getPrice()));
        } else {
            entries.sort((a, b) -> a.getPrice().compareTo(b.getPrice()));
        }

        return entries;
    }

    // ===== Helper Methods =====

    OrderResponse toOrderResponse(Order order) {
        return OrderResponse.builder()
                .id(order.getId())
                .ticker(order.getStock().getTicker())
                .companyName(order.getStock().getCompanyName())
                .side(order.getSide().name())
                .orderType(order.getOrderType().name())
                .quantity(order.getQuantity())
                .filledQuantity(order.getFilledQuantity())
                .price(order.getPrice())
                .status(order.getStatus().name())
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }

    private String formatCurrency(BigDecimal amount) {
        return String.format("%,.0f", amount);
    }
}
