package com.stocklab.service;

public interface SmsService {
    void sendSms(String phoneNumber, String message);
}
