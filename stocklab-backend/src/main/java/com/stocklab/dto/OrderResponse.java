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
public class OrderResponse {

    private Long id;
    private UserDto user;
    private String ticker;
    private String companyName;
    private String side;        // BUY / SELL
    private String orderType;   // MARKET / LIMIT
    private Integer quantity;
    private Integer filledQuantity;
    private BigDecimal price;
    private String status;      // PENDING / PARTIAL / FILLED / CANCELLED / REJECTED
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class UserDto {
        private Long id;
        private String username;
        private String email;
    }
}
