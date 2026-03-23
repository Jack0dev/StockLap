package com.stocklab.controller;

import com.stocklab.dto.ApiResponse;
import com.stocklab.service.OtpService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/otp")
@RequiredArgsConstructor
public class OtpController {

    private final OtpService otpService;

    /**
     * Gửi mã OTP cho user hiện tại
     */
    @PostMapping("/send")
    public ResponseEntity<ApiResponse<String>> sendOtp(
            @AuthenticationPrincipal UserDetails userDetails) {
        ApiResponse<String> response = otpService.sendOtp(userDetails.getUsername());
        return ResponseEntity.ok(response);
    }
}
