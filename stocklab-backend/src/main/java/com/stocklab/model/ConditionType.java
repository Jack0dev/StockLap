package com.stocklab.model;

/**
 * Loại lệnh điều kiện
 */
public enum ConditionType {
    GTD,                // Good Till Date — Limit order with expiry
    STOP,               // Stop — trigger Market khi chạm Stop Price
    STOP_LIMIT,         // Stop Limit — trigger Limit khi chạm Stop Price
    TRAILING_STOP,      // Trailing Stop — Stop di chuyển theo giá
    TRAILING_STOP_LIMIT,// Trailing Stop Limit — Trailing + Limit
    OCO,                // One Cancels Other — 2 lệnh đối lập
    SL_TP               // Stop Loss / Take Profit
}
