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
public class TradeResponse {

    private Long transactionId;
    private String ticker;
    private String companyName;
    private String type;
    private Integer quantity;
    private BigDecimal price;
    private BigDecimal totalAmount;
    private BigDecimal balanceAfter;
    private LocalDateTime timestamp;
}
