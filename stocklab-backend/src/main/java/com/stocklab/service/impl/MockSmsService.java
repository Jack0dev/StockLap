package com.stocklab.service.impl;

import com.stocklab.service.SmsService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class MockSmsService implements SmsService {

    @Override
    public void sendSms(String phoneNumber, String message) {
        log.info("📱 [MOCK SMS] Gửi đến {}: {}", phoneNumber, message);
        // Trong môi trường thực tế, đây là nơi gọi API của Twilio, Nexmo, v.v.
    }
}
