package com.stocklab.model;

public enum OrderType {
    MARKET,  // Lệnh thị trường — khớp ngay theo giá tốt nhất
    LIMIT    // Lệnh giới hạn — chỉ khớp khi giá đạt mức mong muốn
}
