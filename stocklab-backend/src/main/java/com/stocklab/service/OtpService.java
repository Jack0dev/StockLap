package com.stocklab.service;

import com.stocklab.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Mock OTP Service — lưu OTP tạm trong memory.
 * Trong production sẽ gửi qua SMS/Email.
 */
@Service
@RequiredArgsConstructor
public class OtpService {

    // Map<username, otpCode>
    private final Map<String, String> otpStore = new ConcurrentHashMap<>();
    private final Random random = new Random();

    /**
     * Tạo OTP 6 chữ số và lưu vào memory.
     * Mock: luôn trả về "123456" để dễ test.
     * Trong production sẽ generate random và gửi qua SMS/Email.
     */
    public ApiResponse<String> sendOtp(String username) {
        // Mock: dùng OTP cố định để test
        String otp = "123456";

        // Uncomment dòng dưới để dùng OTP random (production)
        // String otp = String.format("%06d", random.nextInt(999999));

        otpStore.put(username, otp);
        return ApiResponse.success("Đã gửi mã OTP. (Mock: " + otp + ")", otp);
    }

    /**
     * Xác thực OTP
     */
    public boolean verifyOtp(String username, String otpCode) {
        if (otpCode == null || otpCode.isEmpty()) {
            return false;
        }
        String storedOtp = otpStore.get(username);
        if (storedOtp != null && storedOtp.equals(otpCode)) {
            otpStore.remove(username); // OTP chỉ dùng 1 lần
            return true;
        }
        return false;
    }

    /**
     * Kiểm tra user đã có OTP chưa (chưa verify)
     */
    public boolean hasOtp(String username) {
        return otpStore.containsKey(username);
    }
}
