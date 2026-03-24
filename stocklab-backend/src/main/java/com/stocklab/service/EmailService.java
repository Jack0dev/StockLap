package com.stocklab.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender javaMailSender;

    @Async
    public void sendEmail(String to, String subject, String body) {
        System.out.println("\n========== [MAILTRAP / MOCK EMAIL] ==========");
        System.out.println("To: " + to);
        System.out.println("Subject: " + subject);
        System.out.println("Body:\n" + body);
        System.out.println("=============================================\n");

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("noreply@stocklab.com");
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            javaMailSender.send(message);
        } catch (Exception e) {
            System.err.println("Không thể gửi email thực do sai cấu hình SMTP: " + e.getMessage());
            System.err.println("Nhưng bạn có thể dùng mã OTP đã in ra ở trên để test tiếp!");
        }
    }
}
