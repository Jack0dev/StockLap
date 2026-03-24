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
            // Không in ra màn hình lỗi Authentication failed để tránh làm rối log khi test local
            System.out.println("[Mock Email] Đã bỏ qua gửi email thực tế. Vui lòng lấy mã OTP ở trên.");
        }
    }
}
