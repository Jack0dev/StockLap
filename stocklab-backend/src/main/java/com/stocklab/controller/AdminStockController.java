package com.stocklab.controller;

import com.stocklab.dto.ApiResponse;
import com.stocklab.dto.CreateStockRequest;
import com.stocklab.dto.StockResponse;
import com.stocklab.service.StockService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import com.stocklab.service.AuditLogService;
import com.stocklab.model.ActionType;

@RestController
@RequestMapping("/api/admin/stocks")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminStockController {

    private final StockService stockService;
    private final AuditLogService auditLogService;

    @GetMapping
    public ApiResponse<Page<StockResponse>> getAllStocks(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size,
            @RequestParam(defaultValue = "ticker") String sort,
            @RequestParam(required = false) String exchange) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(sort).ascending());
        if (exchange != null && !exchange.isEmpty()) {
            return stockService.getStocksByExchange(exchange, pageable);
        }
        return stockService.getAllStocks(pageable);
    }

    @PostMapping
    public ApiResponse<StockResponse> createStock(@Valid @RequestBody CreateStockRequest request) {
        ApiResponse<StockResponse> res = stockService.createStock(request);
        if (res.isSuccess()) {
            auditLogService.logAction(SecurityContextHolder.getContext().getAuthentication().getName(), ActionType.CREATE, "Stock", request.getTicker(), "Tạo cổ phiếu mới");
        }
        return res;
    }

    @PutMapping("/{id}")
    public ApiResponse<StockResponse> updateStock(
            @PathVariable Long id, 
            @Valid @RequestBody CreateStockRequest request) {
        ApiResponse<StockResponse> res = stockService.updateStock(id, request);
        if (res.isSuccess()) {
            auditLogService.logAction(SecurityContextHolder.getContext().getAuthentication().getName(), ActionType.UPDATE, "Stock", String.valueOf(id), "Cập nhật cổ phiếu " + request.getTicker());
        }
        return res;
    }
    
    @PutMapping("/{id}/toggle-status")
    public ApiResponse<String> toggleStockStatus(@PathVariable Long id) {
        ApiResponse<String> res = stockService.toggleStockStatus(id);
        if (res.isSuccess()) {
            auditLogService.logAction(SecurityContextHolder.getContext().getAuthentication().getName(), ActionType.STATUS_CHANGE, "Stock", String.valueOf(id), res.getMessage());
        }
        return res;
    }

    @DeleteMapping("/{id}")
    public ApiResponse<String> deleteStock(@PathVariable Long id) {
        ApiResponse<String> res = stockService.deleteStock(id);
        if (res.isSuccess()) {
            auditLogService.logAction(SecurityContextHolder.getContext().getAuthentication().getName(), ActionType.DELETE, "Stock", String.valueOf(id), "Xóa cổ phiếu");
        }
        return res;
    }
}
