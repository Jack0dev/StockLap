package com.stocklab.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ConditionalOrderResponse {
    private Long id;
    private String ticker;
    private String companyName;
    private String side;
    private String conditionType;
    private String status;
    private Integer quantity;

    private BigDecimal limitPrice;
    private BigDecimal stopPrice;
    private String trailingType;
    private BigDecimal trailingAmount;
    private BigDecimal ocoPrice1;
    private BigDecimal ocoPrice2;
    private BigDecimal stopLossPrice;
    private BigDecimal takeProfitPrice;

    private LocalDateTime effectiveDate;
    private LocalDateTime expiryDate;

    private Long triggeredOrderId;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
