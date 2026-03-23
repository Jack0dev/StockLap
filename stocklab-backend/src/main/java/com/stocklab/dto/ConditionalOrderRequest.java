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
public class ConditionalOrderRequest {

    @NotBlank(message = "Mã cổ phiếu không được để trống")
    private String ticker;

    @NotNull(message = "Loại lệnh (BUY/SELL) không được để trống")
    private String side;

    @NotNull(message = "Loại điều kiện không được để trống")
    private String conditionType;

    @NotNull(message = "Số lượng không được để trống")
    @Min(value = 1, message = "Số lượng phải lớn hơn 0")
    private Integer quantity;

    // GTD / Stop Limit / Trailing Stop Limit
    private BigDecimal limitPrice;

    // Stop / Stop Limit
    private BigDecimal stopPrice;

    // Trailing Stop / Trailing Stop Limit
    private String trailingType; // PERCENT or AMOUNT
    private BigDecimal trailingAmount;

    // OCO
    private BigDecimal ocoPrice1; // Take Profit
    private BigDecimal ocoPrice2; // Stop Loss

    // SL/TP
    private BigDecimal stopLossPrice;
    private BigDecimal takeProfitPrice;

    // Dates
    @NotBlank(message = "Ngày hiệu lực không được để trống")
    private String effectiveDate;

    @NotBlank(message = "Ngày hết hạn không được để trống")
    private String expiryDate;

    // OTP
    @NotBlank(message = "Mã OTP không được để trống")
    private String otpCode;
}
