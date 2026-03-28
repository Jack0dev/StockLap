package com.stocklab.service;

import com.stocklab.dto.OrderRequest;
import com.stocklab.model.OrderSide;
import com.stocklab.model.OrderType;
import com.stocklab.model.Stock;
import com.stocklab.repository.StockRepository;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentLinkedDeque;
import java.util.concurrent.atomic.AtomicLong;

@Service
@RequiredArgsConstructor
@Slf4j
public class TradingBotService {

    private final OrderService orderService;
    private final StockRepository stockRepository;
    private final WebSocketService webSocketService; // Injected WS service
    private final Random random = new Random();

    @Value("${app.bot.enabled:false}")
    @Getter
    private boolean botEnabled;

    @Value("${app.bot.username:bot_liquidity}")
    @Getter
    private String botUsername;

    @Value("${app.bot.interval-ms:5000}")
    @Getter
    private long intervalMs;

    // Lưu 50 lệnh gần nhất để hiển thị trên Frontend
    private final Deque<BotOrderLog> recentOrders = new ConcurrentLinkedDeque<>();
    private static final int MAX_LOG_SIZE = 50;
    private final AtomicLong totalOrdersPlaced = new AtomicLong(0);

    /**
     * Chạy định kỳ để tạo lệnh giả lập (Thanh khoản)
     */
    @Scheduled(fixedDelayString = "${app.bot.interval-ms:5000}")
    public void runBotTask() {
        if (!botEnabled) return;

        try {
            List<Stock> stocks = stockRepository.findAll();
            if (stocks.isEmpty()) return;

            // 1. Chọn ngẫu nhiên cổ phiếu
            Stock stock = stocks.get(random.nextInt(stocks.size()));

            // 2. Chọn BUY hoặc SELL
            OrderSide side = random.nextBoolean() ? OrderSide.BUY : OrderSide.SELL;

            // 3. Số lượng 10–500, bội số 10
            int quantity = (random.nextInt(50) + 1) * 10;

            // 4. Giá ngẫu nhiên +/- 1% giá hiện tại
            BigDecimal currentPrice = stock.getCurrentPrice();
            double variation = (random.nextDouble() - 0.5) * 0.02;
            BigDecimal price = currentPrice.multiply(BigDecimal.valueOf(1 + variation))
                    .setScale(0, RoundingMode.HALF_UP);

            // 5. Đặt lệnh
            OrderRequest request = new OrderRequest();
            request.setTicker(stock.getTicker());
            request.setSide(side.name());
            request.setOrderType(OrderType.LIMIT.name());
            request.setQuantity(quantity);
            request.setPrice(price);

            orderService.placeOrder(botUsername, request);
            totalOrdersPlaced.incrementAndGet();

            // 6. Lưu log bộ nhớ
            BotOrderLog entry = new BotOrderLog(
                    stock.getTicker(), side.name(), quantity,
                    price, LocalDateTime.now(), "SUCCESS"
            );
            recentOrders.addFirst(entry);
            while (recentOrders.size() > MAX_LOG_SIZE) {
                recentOrders.removeLast();
            }

            log.info("🤖 Bot [{}] {} {} CP {} @ {}",
                    botUsername, side, quantity, stock.getTicker(), price);

            // 7. 🔥 Broadcast qua WebSocket để frontend nhận liền
            if (webSocketService != null) {
                webSocketService.broadcastBotOrder(stock.getTicker(), side.name(), quantity, price);
            }

        } catch (Exception e) {
            log.error("❌ Bot error: {}", e.getMessage());
        }
    }

    public List<BotOrderLog> getRecentOrders() {
        return new ArrayList<>(recentOrders);
    }

    public long getTotalOrdersPlaced() {
        return totalOrdersPlaced.get();
    }

    // DTO cho log activity
    public record BotOrderLog(
            String ticker,
            String side,
            int quantity,
            BigDecimal price,
            LocalDateTime timestamp,
            String status
    ) {}
}
