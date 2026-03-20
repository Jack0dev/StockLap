package com.stocklab.controller;

import com.stocklab.dto.*;
import com.stocklab.service.TradeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/trade")
@RequiredArgsConstructor
public class TradeController {

    private final TradeService tradeService;

    /**
     * POST /api/trade/buy
     * Mua cổ phiếu
     */
    @PostMapping("/buy")
    public ResponseEntity<ApiResponse<TradeResponse>> buyStock(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody TradeRequest request) {

        ApiResponse<TradeResponse> response = tradeService.buyStock(
                userDetails.getUsername(), request);

        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.badRequest().body(response);
    }

    /**
     * POST /api/trade/sell
     * Bán cổ phiếu
     */
    @PostMapping("/sell")
    public ResponseEntity<ApiResponse<TradeResponse>> sellStock(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody TradeRequest request) {

        ApiResponse<TradeResponse> response = tradeService.sellStock(
                userDetails.getUsername(), request);

        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.badRequest().body(response);
    }

    /**
     * GET /api/trade/transactions?page=0&size=20&type=BUY
     * Lịch sử giao dịch
     */
    @GetMapping("/transactions")
    public ResponseEntity<ApiResponse<Page<TransactionResponse>>> getTransactionHistory(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String type) {

        Pageable pageable = PageRequest.of(page, size);
        ApiResponse<Page<TransactionResponse>> response = tradeService.getTransactionHistory(
                userDetails.getUsername(), pageable, type);

        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.badRequest().body(response);
    }

    /**
     * GET /api/trade/portfolio
     * Danh mục đầu tư
     */
    @GetMapping("/portfolio")
    public ResponseEntity<ApiResponse<List<PortfolioResponse>>> getPortfolio(
            @AuthenticationPrincipal UserDetails userDetails) {

        ApiResponse<List<PortfolioResponse>> response = tradeService.getPortfolio(
                userDetails.getUsername());

        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.badRequest().body(response);
    }
}
