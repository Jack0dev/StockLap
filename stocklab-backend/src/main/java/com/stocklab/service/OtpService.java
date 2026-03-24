package com.stocklab.service;

import com.stocklab.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class OtpService {

    private static final String OTP_PREFIX = "OTP:";
    private static final long OTP_VALID_DURATION_MINUTES = 5;

    private final RedisTemplate<String, String> redisTemplate;
    private final EmailService emailService;

    public ApiResponse<String> sendOtp(String email) {
        String otp = generateNumericOtp(6);
        String key = OTP_PREFIX + email;
        
        // Save to Redis with 5 minutes TTL
        redisTemplate.opsForValue().set(key, otp, OTP_VALID_DURATION_MINUTES, TimeUnit.MINUTES);
        
        // Send email
        String subject = "StockLab - Mã xác thực OTP";
        String body = "Mã xác thực của bạn là: " + otp + "\n"
                + "Mã này có hiệu lực trong " + OTP_VALID_DURATION_MINUTES + " phút.\n"
                + "Vui lòng không chia sẻ mã này cho bất kỳ ai!";
        
        emailService.sendEmail(email, subject, body);
        
        return ApiResponse.success("Đã gửi mã OTP đến email của bạn.", null);
    }

    public boolean verifyOtp(String email, String otpCode) {
        if (otpCode == null || otpCode.isEmpty()) {
            return false;
        }
        String key = OTP_PREFIX + email;
        String cachedOtp = redisTemplate.opsForValue().get(key);
        
        if (cachedOtp != null && cachedOtp.equals(otpCode)) {
            // Delete OTP after successful verification to prevent reuse
            redisTemplate.delete(key);
            return true;
        }
        return false;
    }

    public boolean hasOtp(String email) {
        String key = OTP_PREFIX + email;
        return Boolean.TRUE.equals(redisTemplate.hasKey(key));
    }

    private String generateNumericOtp(int length) {
        SecureRandom random = new SecureRandom();
        StringBuilder otp = new StringBuilder();
        for (int i = 0; i < length; i++) {
            otp.append(random.nextInt(10));
        }
        return otp.toString();
    }
}
