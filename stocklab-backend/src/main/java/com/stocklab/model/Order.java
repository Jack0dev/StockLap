package com.stocklab.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "orders", indexes = {
        @Index(name = "idx_order_user", columnList = "user_id"),
        @Index(name = "idx_order_stock_status", columnList = "stock_id, status"),
        @Index(name = "idx_order_stock_side_status", columnList = "stock_id, side, status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stock_id", nullable = false)
    private Stock stock;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private OrderSide side; // BUY hoặc SELL

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private OrderType orderType; // MARKET hoặc LIMIT

    @Column(nullable = false)
    private Integer quantity; // Số lượng đặt

    @Column(nullable = false)
    @Builder.Default
    private Integer filledQuantity = 0; // Số lượng đã khớp

    @Column(precision = 15, scale = 2)
    private BigDecimal price; // Giá đặt (bắt buộc cho LIMIT, null cho MARKET)

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    @Builder.Default
    private OrderStatus status = OrderStatus.PENDING;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    /**
     * Số lượng còn lại chưa khớp
     */
    public int getRemainingQuantity() {
        return quantity - filledQuantity;
    }

    /**
     * Kiểm tra lệnh có thể hủy không (chỉ PENDING hoặc PARTIAL)
     */
    public boolean isCancellable() {
        return status == OrderStatus.PENDING || status == OrderStatus.PARTIAL;
    }
}
