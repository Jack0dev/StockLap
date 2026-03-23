package com.stocklab.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class OrderRequest {

    @NotBlank(message = "Mã cổ phiếu không được để trống")
    private String ticker;

    @NotNull(message = "Loại lệnh (BUY/SELL) không được để trống")
    private String side; // BUY hoặc SELL

    @NotNull(message = "Kiểu lệnh (MARKET/LIMIT) không được để trống")
    private String orderType; // MARKET hoặc LIMIT

    @NotNull(message = "Số lượng không được để trống")
    @Min(value = 1, message = "Số lượng phải lớn hơn 0")
    private Integer quantity;

    // Giá đặt — bắt buộc khi orderType = LIMIT, bỏ qua khi MARKET
    private BigDecimal price;
}
