package com.stocklab.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "conditional_orders", indexes = {
        @Index(name = "idx_cond_order_user", columnList = "user_id"),
        @Index(name = "idx_cond_order_status", columnList = "status"),
        @Index(name = "idx_cond_order_stock_status", columnList = "stock_id, status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConditionalOrder {

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
    @Column(nullable = false, length = 25)
    private ConditionType conditionType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    @Builder.Default
    private ConditionalOrderStatus status = ConditionalOrderStatus.ACTIVE;

    @Column(nullable = false)
    private Integer quantity;

    // === GTD / Stop Limit / Trailing Stop Limit ===
    @Column(precision = 15, scale = 2)
    private BigDecimal limitPrice;

    // === Stop / Stop Limit ===
    @Column(precision = 15, scale = 2)
    private BigDecimal stopPrice;

    // === Trailing Stop / Trailing Stop Limit ===
    @Enumerated(EnumType.STRING)
    @Column(length = 10)
    private TrailingType trailingType; // PERCENT or AMOUNT

    @Column(precision = 15, scale = 4)
    private BigDecimal trailingAmount;

    // === OCO ===
    @Column(precision = 15, scale = 2)
    private BigDecimal ocoPrice1; // Take Profit price

    @Column(precision = 15, scale = 2)
    private BigDecimal ocoPrice2; // Stop Loss price

    // === SL/TP ===
    @Column(precision = 15, scale = 2)
    private BigDecimal stopLossPrice;

    @Column(precision = 15, scale = 2)
    private BigDecimal takeProfitPrice;

    // === Date fields ===
    @Column(nullable = false)
    private LocalDateTime effectiveDate;

    @Column(nullable = false)
    private LocalDateTime expiryDate;

    // === Triggered order reference ===
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "triggered_order_id")
    private Order triggeredOrder;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    /**
     * Kiểm tra lệnh có thể hủy không
     */
    public boolean isCancellable() {
        return status == ConditionalOrderStatus.ACTIVE;
    }
}
