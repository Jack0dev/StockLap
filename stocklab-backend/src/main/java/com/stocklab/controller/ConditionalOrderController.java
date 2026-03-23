package com.stocklab.controller;

import com.stocklab.dto.*;
import com.stocklab.service.ConditionalOrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/conditional-orders")
@RequiredArgsConstructor
public class ConditionalOrderController {

    private final ConditionalOrderService conditionalOrderService;

    /**
     * Đặt lệnh điều kiện
     */
    @PostMapping
    public ResponseEntity<ApiResponse<ConditionalOrderResponse>> placeConditionalOrder(
            @Valid @RequestBody ConditionalOrderRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        ApiResponse<ConditionalOrderResponse> response =
                conditionalOrderService.placeConditionalOrder(userDetails.getUsername(), request);
        return ResponseEntity.ok(response);
    }

    /**
     * Lấy danh sách lệnh điều kiện của user
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<ConditionalOrderResponse>>> getMyConditionalOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status,
            @AuthenticationPrincipal UserDetails userDetails) {
        ApiResponse<Page<ConditionalOrderResponse>> response =
                conditionalOrderService.getMyConditionalOrders(
                        userDetails.getUsername(),
                        PageRequest.of(page, size, Sort.by("createdAt").descending()),
                        status);
        return ResponseEntity.ok(response);
    }

    /**
     * Hủy lệnh điều kiện
     */
    @PutMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<ConditionalOrderResponse>> cancelConditionalOrder(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        ApiResponse<ConditionalOrderResponse> response =
                conditionalOrderService.cancelConditionalOrder(userDetails.getUsername(), id);
        return ResponseEntity.ok(response);
    }
}
