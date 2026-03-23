package com.stocklab.model;

/**
 * Trạng thái lệnh điều kiện
 */
public enum ConditionalOrderStatus {
    ACTIVE,     // Đang chờ điều kiện kích hoạt
    TRIGGERED,  // Đã kích hoạt → đã tạo Order thường
    CANCELLED,  // Đã hủy
    EXPIRED     // Hết hạn
}
