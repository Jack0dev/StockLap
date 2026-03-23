package com.stocklab.service;

import com.stocklab.dto.ApiResponse;
import com.stocklab.dto.OrderRequest;
import com.stocklab.dto.OrderResponse;
import com.stocklab.model.*;
import com.stocklab.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("OrderService Tests")
class OrderServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private StockRepository stockRepository;
    @Mock
    private OrderRepository orderRepository;
    @Mock
    private PortfolioRepository portfolioRepository;

    @InjectMocks
    private OrderService orderService;

    private User testUser;
    private Stock testStock;
    private Portfolio testPortfolio;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .username("testuser")
                .email("test@test.com")
                .password("password")
                .balance(new BigDecimal("10000000.00"))
                .lockedBalance(BigDecimal.ZERO)
                .build();

        testStock = Stock.builder()
                .id(1L)
                .ticker("VNM")
                .companyName("Vinamilk")
                .currentPrice(new BigDecimal("85000.00"))
                .build();

        testPortfolio = Portfolio.builder()
                .id(1L)
                .user(testUser)
                .stock(testStock)
                .quantity(100)
                .lockedQuantity(0)
                .avgBuyPrice(new BigDecimal("80000.00"))
                .build();
    }

    // ===== placeOrder — Validation Tests =====

    @Nested
    @DisplayName("placeOrder — Validation")
    class PlaceOrderValidationTests {

        @Test
        @DisplayName("User không tồn tại → error")
        void shouldFailWhenUserNotFound() {
            when(userRepository.findByUsername("unknown")).thenReturn(Optional.empty());

            OrderRequest request = OrderRequest.builder()
                    .ticker("VNM").side("BUY").orderType("LIMIT")
                    .quantity(10).price(new BigDecimal("85000")).build();

            ApiResponse<OrderResponse> result = orderService.placeOrder("unknown", request);

            assertFalse(result.isSuccess());
            assertEquals("Không tìm thấy người dùng", result.getMessage());
        }

        @Test
        @DisplayName("Stock không tồn tại → error")
        void shouldFailWhenStockNotFound() {
            when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
            when(stockRepository.findByTicker("INVALID")).thenReturn(Optional.empty());

            OrderRequest request = OrderRequest.builder()
                    .ticker("INVALID").side("BUY").orderType("LIMIT")
                    .quantity(10).price(new BigDecimal("85000")).build();

            ApiResponse<OrderResponse> result = orderService.placeOrder("testuser", request);

            assertFalse(result.isSuccess());
            assertTrue(result.getMessage().contains("Không tìm thấy cổ phiếu"));
        }

        @Test
        @DisplayName("Side không hợp lệ → error")
        void shouldFailWhenInvalidSide() {
            when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
            when(stockRepository.findByTicker("VNM")).thenReturn(Optional.of(testStock));

            OrderRequest request = OrderRequest.builder()
                    .ticker("VNM").side("SHORT").orderType("LIMIT")
                    .quantity(10).price(new BigDecimal("85000")).build();

            ApiResponse<OrderResponse> result = orderService.placeOrder("testuser", request);

            assertFalse(result.isSuccess());
            assertTrue(result.getMessage().contains("Loại lệnh không hợp lệ"));
        }

        @Test
        @DisplayName("OrderType không hợp lệ → error")
        void shouldFailWhenInvalidOrderType() {
            when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
            when(stockRepository.findByTicker("VNM")).thenReturn(Optional.of(testStock));

            OrderRequest request = OrderRequest.builder()
                    .ticker("VNM").side("BUY").orderType("STOP_LOSS")
                    .quantity(10).price(new BigDecimal("85000")).build();

            ApiResponse<OrderResponse> result = orderService.placeOrder("testuser", request);

            assertFalse(result.isSuccess());
            assertTrue(result.getMessage().contains("Kiểu lệnh không hợp lệ"));
        }

        @Test
        @DisplayName("LIMIT order không có giá → error")
        void shouldFailWhenLimitOrderWithoutPrice() {
            when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
            when(stockRepository.findByTicker("VNM")).thenReturn(Optional.of(testStock));

            OrderRequest request = OrderRequest.builder()
                    .ticker("VNM").side("BUY").orderType("LIMIT")
                    .quantity(10).price(null).build();

            ApiResponse<OrderResponse> result = orderService.placeOrder("testuser", request);

            assertFalse(result.isSuccess());
            assertTrue(result.getMessage().contains("Lệnh LIMIT bắt buộc phải có giá"));
        }
    }

    // ===== placeOrder — BUY =====

    @Nested
    @DisplayName("placeOrder — BUY")
    class PlaceBuyOrderTests {

        @Test
        @DisplayName("BUY LIMIT thành công — lock tiền")
        void shouldPlaceBuyLimitOrderSuccessfully() {
            when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
            when(stockRepository.findByTicker("VNM")).thenReturn(Optional.of(testStock));
            when(orderRepository.save(any(Order.class))).thenAnswer(i -> {
                Order o = i.getArgument(0);
                o.setId(1L);
                return o;
            });

            OrderRequest request = OrderRequest.builder()
                    .ticker("VNM").side("BUY").orderType("LIMIT")
                    .quantity(10).price(new BigDecimal("85000.00")).build();

            ApiResponse<OrderResponse> result = orderService.placeOrder("testuser", request);

            assertTrue(result.isSuccess());
            assertEquals("BUY", result.getData().getSide());
            assertEquals("LIMIT", result.getData().getOrderType());
            assertEquals(10, result.getData().getQuantity());
            assertEquals(0, result.getData().getFilledQuantity());
            assertEquals("PENDING", result.getData().getStatus());

            // Verify lock tiền: 10 * 85000 = 850000
            assertEquals(new BigDecimal("850000.00"), testUser.getLockedBalance());
            verify(userRepository).save(testUser);
            verify(orderRepository).save(any(Order.class));
        }

        @Test
        @DisplayName("BUY MARKET thành công — dùng giá hiện tại")
        void shouldPlaceBuyMarketOrderWithCurrentPrice() {
            when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
            when(stockRepository.findByTicker("VNM")).thenReturn(Optional.of(testStock));
            when(orderRepository.save(any(Order.class))).thenAnswer(i -> {
                Order o = i.getArgument(0);
                o.setId(1L);
                return o;
            });

            OrderRequest request = OrderRequest.builder()
                    .ticker("VNM").side("BUY").orderType("MARKET")
                    .quantity(10).build();

            ApiResponse<OrderResponse> result = orderService.placeOrder("testuser", request);

            assertTrue(result.isSuccess());
            assertEquals("MARKET", result.getData().getOrderType());
            // Giá = currentPrice = 85000
            assertEquals(new BigDecimal("85000.00"), result.getData().getPrice());
        }

        @Test
        @DisplayName("BUY — số dư không đủ → error")
        void shouldFailBuyWhenInsufficientBalance() {
            testUser.setBalance(new BigDecimal("100000.00")); // Chỉ có 100k
            when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
            when(stockRepository.findByTicker("VNM")).thenReturn(Optional.of(testStock));

            OrderRequest request = OrderRequest.builder()
                    .ticker("VNM").side("BUY").orderType("LIMIT")
                    .quantity(100).price(new BigDecimal("85000.00")).build(); // Cần 8.5 triệu

            ApiResponse<OrderResponse> result = orderService.placeOrder("testuser", request);

            assertFalse(result.isSuccess());
            assertTrue(result.getMessage().contains("Số dư khả dụng không đủ"));
            verify(orderRepository, never()).save(any());
        }

        @Test
        @DisplayName("BUY — tính available balance trừ locked → error")
        void shouldConsiderLockedBalanceForBuy() {
            testUser.setBalance(new BigDecimal("1000000.00"));
            testUser.setLockedBalance(new BigDecimal("500000.00")); // Đã lock 500k → available = 500k
            when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
            when(stockRepository.findByTicker("VNM")).thenReturn(Optional.of(testStock));

            OrderRequest request = OrderRequest.builder()
                    .ticker("VNM").side("BUY").orderType("LIMIT")
                    .quantity(10).price(new BigDecimal("85000.00")).build(); // Cần 850k > 500k available

            ApiResponse<OrderResponse> result = orderService.placeOrder("testuser", request);

            assertFalse(result.isSuccess());
            assertTrue(result.getMessage().contains("Số dư khả dụng không đủ"));
        }
    }

    // ===== placeOrder — SELL =====

    @Nested
    @DisplayName("placeOrder — SELL")
    class PlaceSellOrderTests {

        @Test
        @DisplayName("SELL LIMIT thành công — lock CP")
        void shouldPlaceSellLimitOrderSuccessfully() {
            when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
            when(stockRepository.findByTicker("VNM")).thenReturn(Optional.of(testStock));
            when(portfolioRepository.findByUserIdAndStockId(1L, 1L)).thenReturn(Optional.of(testPortfolio));
            when(orderRepository.save(any(Order.class))).thenAnswer(i -> {
                Order o = i.getArgument(0);
                o.setId(1L);
                return o;
            });

            OrderRequest request = OrderRequest.builder()
                    .ticker("VNM").side("SELL").orderType("LIMIT")
                    .quantity(50).price(new BigDecimal("90000.00")).build();

            ApiResponse<OrderResponse> result = orderService.placeOrder("testuser", request);

            assertTrue(result.isSuccess());
            assertEquals("SELL", result.getData().getSide());
            assertEquals("PENDING", result.getData().getStatus());

            // Verify lock CP: lockedQuantity += 50
            assertEquals(50, testPortfolio.getLockedQuantity());
            verify(portfolioRepository).save(testPortfolio);
        }

        @Test
        @DisplayName("SELL — không có CP → error")
        void shouldFailSellWhenNoPortfolio() {
            when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
            when(stockRepository.findByTicker("VNM")).thenReturn(Optional.of(testStock));
            when(portfolioRepository.findByUserIdAndStockId(1L, 1L)).thenReturn(Optional.empty());

            OrderRequest request = OrderRequest.builder()
                    .ticker("VNM").side("SELL").orderType("LIMIT")
                    .quantity(10).price(new BigDecimal("90000.00")).build();

            ApiResponse<OrderResponse> result = orderService.placeOrder("testuser", request);

            assertFalse(result.isSuccess());
            assertTrue(result.getMessage().contains("Không đủ cổ phiếu để bán"));
        }

        @Test
        @DisplayName("SELL — CP không đủ (tính cả locked) → error")
        void shouldConsiderLockedQuantityForSell() {
            testPortfolio.setLockedQuantity(80); // Đã lock 80/100 → available = 20
            when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
            when(stockRepository.findByTicker("VNM")).thenReturn(Optional.of(testStock));
            when(portfolioRepository.findByUserIdAndStockId(1L, 1L)).thenReturn(Optional.of(testPortfolio));

            OrderRequest request = OrderRequest.builder()
                    .ticker("VNM").side("SELL").orderType("LIMIT")
                    .quantity(50).price(new BigDecimal("90000.00")).build(); // Cần 50 > 20 available

            ApiResponse<OrderResponse> result = orderService.placeOrder("testuser", request);

            assertFalse(result.isSuccess());
            assertTrue(result.getMessage().contains("Không đủ cổ phiếu để bán"));
        }
    }

    // ===== toOrderResponse =====

    @Nested
    @DisplayName("toOrderResponse")
    class ToOrderResponseTests {

        @Test
        @DisplayName("Chuyển đổi Order → OrderResponse đúng")
        void shouldMapOrderToResponseCorrectly() {
            Order order = Order.builder()
                    .id(1L)
                    .user(testUser)
                    .stock(testStock)
                    .side(OrderSide.BUY)
                    .orderType(OrderType.LIMIT)
                    .quantity(100)
                    .filledQuantity(30)
                    .price(new BigDecimal("85000.00"))
                    .status(OrderStatus.PARTIAL)
                    .build();

            OrderResponse response = orderService.toOrderResponse(order);

            assertEquals(1L, response.getId());
            assertEquals("VNM", response.getTicker());
            assertEquals("Vinamilk", response.getCompanyName());
            assertEquals("BUY", response.getSide());
            assertEquals("LIMIT", response.getOrderType());
            assertEquals(100, response.getQuantity());
            assertEquals(30, response.getFilledQuantity());
            assertEquals("PARTIAL", response.getStatus());
        }
    }
}
