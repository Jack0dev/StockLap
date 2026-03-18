package com.stocklab.controller;

import com.stocklab.dto.*;
import com.stocklab.service.StockService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stocks")
@RequiredArgsConstructor
public class StockController {

    private final StockService stockService;

    /**
     * GET /api/stocks?page=0&size=20&sort=ticker&exchange=HOSE
     * Lấy danh sách cổ phiếu (hỗ trợ pagination, sorting, filter theo sàn)
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<StockResponse>>> getAllStocks(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "ticker") String sort,
            @RequestParam(required = false) String exchange) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(sort));

        ApiResponse<Page<StockResponse>> response;
        if (exchange != null && !exchange.isEmpty()) {
            response = stockService.getStocksByExchange(exchange, pageable);
        } else {
            response = stockService.getAllStocks(pageable);
        }

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/stocks/search?keyword=vin
     * Tìm kiếm cổ phiếu theo ticker hoặc tên công ty
     */
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<StockResponse>>> searchStocks(
            @RequestParam String keyword) {

        ApiResponse<List<StockResponse>> response = stockService.searchStocks(keyword);
        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.badRequest().body(response);
    }

    /**
     * GET /api/stocks/{ticker}
     * Lấy chi tiết cổ phiếu theo mã ticker
     */
    @GetMapping("/{ticker}")
    public ResponseEntity<ApiResponse<StockResponse>> getStockByTicker(
            @PathVariable String ticker) {

        ApiResponse<StockResponse> response = stockService.getStockByTicker(ticker);
        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.badRequest().body(response);
    }

    /**
     * GET /api/stocks/{ticker}/history?range=1M
     * Lấy lịch sử giá cổ phiếu cho biểu đồ nến
     */
    @GetMapping("/{ticker}/history")
    public ResponseEntity<ApiResponse<List<StockPriceHistoryResponse>>> getPriceHistory(
            @PathVariable String ticker,
            @RequestParam(defaultValue = "1M") String range) {

        ApiResponse<List<StockPriceHistoryResponse>> response = stockService.getPriceHistory(ticker, range);
        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.badRequest().body(response);
    }
}
