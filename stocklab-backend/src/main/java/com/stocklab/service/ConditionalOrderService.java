package com.stocklab.service;

import com.stocklab.dto.*;
import com.stocklab.model.*;
import com.stocklab.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

@Service
@RequiredArgsConstructor
public class ConditionalOrderService {

    private final UserRepository userRepository;
    private final StockRepository stockRepository;
    private final ConditionalOrderRepository conditionalOrderRepository;
    private final OtpService otpService;

    /**
     * Đặt lệnh điều kiện
     */
    @Transactional
    public ApiResponse<ConditionalOrderResponse> placeConditionalOrder(String username, ConditionalOrderRequest request) {
        // 1. Xác thực OTP
        if (!otpService.verifyOtp(username, request.getOtpCode())) {
            return ApiResponse.error("Mã OTP không hợp lệ hoặc đã hết hạn!");
        }

        // 2. Tìm user
        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) {
            return ApiResponse.error("Không tìm thấy người dùng");
        }

        // 3. Tìm stock
        Stock stock = stockRepository.findByTicker(request.getTicker().toUpperCase()).orElse(null);
        if (stock == null) {
            return ApiResponse.error("Không tìm thấy cổ phiếu: " + request.getTicker());
        }

        // 4. Parse enums
        OrderSide side;
        try {
            side = OrderSide.valueOf(request.getSide().toUpperCase());
        } catch (IllegalArgumentException e) {
            return ApiResponse.error("Loại lệnh không hợp lệ: " + request.getSide());
        }

        ConditionType conditionType;
        try {
            conditionType = ConditionType.valueOf(request.getConditionType().toUpperCase());
        } catch (IllegalArgumentException e) {
            return ApiResponse.error("Loại điều kiện không hợp lệ: " + request.getConditionType());
        }

        // 5. Validate quantity
        if (request.getQuantity() == null || request.getQuantity() <= 0) {
            return ApiResponse.error("Số lượng phải lớn hơn 0");
        }

        // 6. Parse dates
        LocalDateTime effectiveDate;
        LocalDateTime expiryDate;
        try {
            effectiveDate = LocalDate.parse(request.getEffectiveDate()).atStartOfDay();
        } catch (DateTimeParseException e) {
            return ApiResponse.error("Ngày hiệu lực không hợp lệ");
        }
        try {
            expiryDate = LocalDateTime.parse(request.getExpiryDate());
        } catch (DateTimeParseException e) {
            // Try date-only format
            try {
                expiryDate = LocalDate.parse(request.getExpiryDate()).atTime(23, 59, 59);
            } catch (DateTimeParseException e2) {
                return ApiResponse.error("Ngày hết hạn không hợp lệ");
            }
        }

        if (expiryDate.isBefore(LocalDateTime.now())) {
            return ApiResponse.error("Ngày hết hạn phải sau thời điểm hiện tại");
        }

        // 7. Validate condition-specific fields
        ApiResponse<Void> validationResult = validateConditionFields(conditionType, request);
        if (validationResult != null) {
            return ApiResponse.error(validationResult.getMessage());
        }

        // 8. Build entity
        ConditionalOrder order = ConditionalOrder.builder()
                .user(user)
                .stock(stock)
                .side(side)
                .conditionType(conditionType)
                .quantity(request.getQuantity())
                .effectiveDate(effectiveDate)
                .expiryDate(expiryDate)
                .status(ConditionalOrderStatus.ACTIVE)
                .build();

        // Set condition-specific fields
        switch (conditionType) {
            case GTD:
                order.setLimitPrice(request.getLimitPrice());
                break;
            case STOP:
                order.setStopPrice(request.getStopPrice());
                break;
            case STOP_LIMIT:
                order.setStopPrice(request.getStopPrice());
                order.setLimitPrice(request.getLimitPrice());
                break;
            case TRAILING_STOP:
                order.setTrailingType(TrailingType.valueOf(request.getTrailingType().toUpperCase()));
                order.setTrailingAmount(request.getTrailingAmount());
                break;
            case TRAILING_STOP_LIMIT:
                order.setTrailingType(TrailingType.valueOf(request.getTrailingType().toUpperCase()));
                order.setTrailingAmount(request.getTrailingAmount());
                order.setLimitPrice(request.getLimitPrice());
                break;
            case OCO:
                order.setOcoPrice1(request.getOcoPrice1());
                order.setOcoPrice2(request.getOcoPrice2());
                break;
            case SL_TP:
                order.setStopLossPrice(request.getStopLossPrice());
                order.setTakeProfitPrice(request.getTakeProfitPrice());
                break;
        }

        conditionalOrderRepository.save(order);

        return ApiResponse.success(
                "Đặt lệnh điều kiện " + conditionType.name() + " thành công! Lệnh sẽ được kích hoạt khi thỏa điều kiện.",
                toResponse(order));
    }

    /**
     * Validate fields theo loại điều kiện
     */
    private ApiResponse<Void> validateConditionFields(ConditionType type, ConditionalOrderRequest req) {
        switch (type) {
            case GTD:
                if (req.getLimitPrice() == null || req.getLimitPrice().compareTo(BigDecimal.ZERO) <= 0) {
                    return ApiResponse.error("GTD: Giá đặt (Limit Price) phải lớn hơn 0");
                }
                break;
            case STOP:
                if (req.getStopPrice() == null || req.getStopPrice().compareTo(BigDecimal.ZERO) <= 0) {
                    return ApiResponse.error("Stop: Giá kích hoạt (Stop Price) phải lớn hơn 0");
                }
                break;
            case STOP_LIMIT:
                if (req.getStopPrice() == null || req.getStopPrice().compareTo(BigDecimal.ZERO) <= 0) {
                    return ApiResponse.error("Stop Limit: Giá kích hoạt phải lớn hơn 0");
                }
                if (req.getLimitPrice() == null || req.getLimitPrice().compareTo(BigDecimal.ZERO) <= 0) {
                    return ApiResponse.error("Stop Limit: Giá Limit phải lớn hơn 0");
                }
                break;
            case TRAILING_STOP:
            case TRAILING_STOP_LIMIT:
                if (req.getTrailingType() == null || req.getTrailingType().isEmpty()) {
                    return ApiResponse.error("Trailing: Phải chọn loại trailing (PERCENT hoặc AMOUNT)");
                }
                if (req.getTrailingAmount() == null || req.getTrailingAmount().compareTo(BigDecimal.ZERO) <= 0) {
                    return ApiResponse.error("Trailing: Khoảng cách trailing phải lớn hơn 0");
                }
                if (type == ConditionType.TRAILING_STOP_LIMIT) {
                    if (req.getLimitPrice() == null || req.getLimitPrice().compareTo(BigDecimal.ZERO) <= 0) {
                        return ApiResponse.error("Trailing Stop Limit: Giá Limit phải lớn hơn 0");
                    }
                }
                break;
            case OCO:
                if (req.getOcoPrice1() == null || req.getOcoPrice1().compareTo(BigDecimal.ZERO) <= 0) {
                    return ApiResponse.error("OCO: Giá lệnh 1 (Take Profit) phải lớn hơn 0");
                }
                if (req.getOcoPrice2() == null || req.getOcoPrice2().compareTo(BigDecimal.ZERO) <= 0) {
                    return ApiResponse.error("OCO: Giá lệnh 2 (Stop Loss) phải lớn hơn 0");
                }
                if (req.getOcoPrice1().compareTo(req.getOcoPrice2()) <= 0) {
                    return ApiResponse.error("OCO: Giá Take Profit phải cao hơn giá Stop Loss");
                }
                break;
            case SL_TP:
                if (req.getStopLossPrice() == null || req.getStopLossPrice().compareTo(BigDecimal.ZERO) <= 0) {
                    return ApiResponse.error("SL/TP: Giá Stop Loss phải lớn hơn 0");
                }
                if (req.getTakeProfitPrice() == null || req.getTakeProfitPrice().compareTo(BigDecimal.ZERO) <= 0) {
                    return ApiResponse.error("SL/TP: Giá Take Profit phải lớn hơn 0");
                }
                if (req.getTakeProfitPrice().compareTo(req.getStopLossPrice()) <= 0) {
                    return ApiResponse.error("SL/TP: Giá Take Profit phải cao hơn giá Stop Loss");
                }
                break;
        }
        return null; // Valid
    }

    /**
     * Lấy danh sách lệnh điều kiện của user
     */
    public ApiResponse<Page<ConditionalOrderResponse>> getMyConditionalOrders(
            String username, Pageable pageable, String status) {
        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) {
            return ApiResponse.error("Không tìm thấy người dùng");
        }

        Page<ConditionalOrderResponse> orders;
        if (status != null && !status.isEmpty()) {
            try {
                ConditionalOrderStatus orderStatus = ConditionalOrderStatus.valueOf(status.toUpperCase());
                orders = conditionalOrderRepository
                        .findByUserIdAndStatusOrderByCreatedAtDesc(user.getId(), orderStatus, pageable)
                        .map(this::toResponse);
            } catch (IllegalArgumentException e) {
                return ApiResponse.error("Trạng thái không hợp lệ: " + status);
            }
        } else {
            orders = conditionalOrderRepository
                    .findByUserIdOrderByCreatedAtDesc(user.getId(), pageable)
                    .map(this::toResponse);
        }

        return ApiResponse.success("OK", orders);
    }

    /**
     * Hủy lệnh điều kiện
     */
    @Transactional
    public ApiResponse<ConditionalOrderResponse> cancelConditionalOrder(String username, Long orderId) {
        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) {
            return ApiResponse.error("Không tìm thấy người dùng");
        }

        ConditionalOrder order = conditionalOrderRepository.findById(orderId).orElse(null);
        if (order == null) {
            return ApiResponse.error("Không tìm thấy lệnh #" + orderId);
        }

        if (!order.getUser().getId().equals(user.getId())) {
            return ApiResponse.error("Bạn không có quyền hủy lệnh này");
        }

        if (!order.isCancellable()) {
            return ApiResponse.error("Không thể hủy lệnh ở trạng thái: " + order.getStatus());
        }

        order.setStatus(ConditionalOrderStatus.CANCELLED);
        conditionalOrderRepository.save(order);

        return ApiResponse.success("Đã hủy lệnh điều kiện #" + orderId, toResponse(order));
    }

    // ===== Helper =====

    private ConditionalOrderResponse toResponse(ConditionalOrder order) {
        return ConditionalOrderResponse.builder()
                .id(order.getId())
                .ticker(order.getStock().getTicker())
                .companyName(order.getStock().getCompanyName())
                .side(order.getSide().name())
                .conditionType(order.getConditionType().name())
                .status(order.getStatus().name())
                .quantity(order.getQuantity())
                .limitPrice(order.getLimitPrice())
                .stopPrice(order.getStopPrice())
                .trailingType(order.getTrailingType() != null ? order.getTrailingType().name() : null)
                .trailingAmount(order.getTrailingAmount())
                .ocoPrice1(order.getOcoPrice1())
                .ocoPrice2(order.getOcoPrice2())
                .stopLossPrice(order.getStopLossPrice())
                .takeProfitPrice(order.getTakeProfitPrice())
                .effectiveDate(order.getEffectiveDate())
                .expiryDate(order.getExpiryDate())
                .triggeredOrderId(order.getTriggeredOrder() != null ? order.getTriggeredOrder().getId() : null)
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }
}
