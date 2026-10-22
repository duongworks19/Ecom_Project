package com.vic.ecom.services;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MailService {

    private static final Logger log = LoggerFactory.getLogger(MailService.class);

    private final JavaMailSender mailSender;

    @Value("${app.mail.from:no-reply@vicmart.local}")
    private String from;

    @Async
    public void sendOtp(String to, String code) {
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(from);
            msg.setTo(to);
            msg.setSubject("Mã xác nhận tài khoản VIC MART");
            msg.setText("""
                    Mã xác nhận tài khoản VIC MART: %s

                    Mã có hiệu lực trong 10 phút và chỉ dùng một lần.
                    Không chia sẻ mã này với bất kỳ ai.
                    """.formatted(code));
            mailSender.send(msg);
        } catch (Exception e) {
            // Never log the OTP or mail body — only the failure itself.
            log.error("Failed to send OTP mail to {}", to, e);
        }
    }

    @Async
    public void sendTemporaryPassword(String to, String temporaryPassword, String loginUrl) {
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(from);
            msg.setTo(to);
            msg.setSubject("Tài khoản Shipper VIC MART");
            msg.setText("Tài khoản Shipper VIC MART\n\n"
                    + "Email đăng nhập: " + to + "\n"
                    + "Mật khẩu tạm: " + temporaryPassword + "\n"
                    + "Trang đăng nhập: " + loginUrl + "\n\n"
                    + "Bạn sẽ được yêu cầu đổi mật khẩu ở lần đăng nhập đầu tiên.\n"
                    + "Không chia sẻ mật khẩu này với bất kỳ ai.");
            mailSender.send(msg);
        } catch (Exception e) {
            log.error("Failed to send shipper temporary-password mail to {}", to, e);
        }
    }
}
