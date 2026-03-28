package com.stocklab.controller;

import com.stocklab.dto.ApiResponse;
import com.stocklab.dto.MockWebhookRequest;
import com.stocklab.service.WalletService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/webhook")
@RequiredArgsConstructor
public class WebhookController {

    private final WalletService walletService;

    @Value("${app.webhook.secret}")
    private String webhookSecret;

    @PostMapping("/bank-transfer")
    public ResponseEntity<ApiResponse<String>> handleBankTransfer(
            @RequestHeader(value = "X-Webhook-Secret", defaultValue = "") String secret,
            @RequestBody MockWebhookRequest request) {

        // Validate Security Key
        if (!webhookSecret.equals(secret)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Unauthorized Webhook call: Invalid Secret Key"));
        }

        // Validate payload
        if (request.getAmount() == null || request.getDescription() == null) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Invalid webhook payload"));
        }

        // Process webhook payload via WalletService
        ApiResponse<String> result = walletService.processMockWebhook(request);

        if (result.isSuccess()) {
            return ResponseEntity.ok(result);
        } else {
            // Dù lỗi nghiệp vụ vẫn trả về 200/400 nhưng bọc JSON lỗi
            return ResponseEntity.badRequest().body(result);
        }
    }
}
