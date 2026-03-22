package com.stocklab.model;

public enum OrderStatus {
    PENDING,    // Chờ khớp lệnh
    PARTIAL,    // Khớp 1 phần
    FILLED,     // Khớp hoàn toàn
    CANCELLED,  // Đã hủy
    REJECTED    // Bị từ chối (không đủ điều kiện)
}
