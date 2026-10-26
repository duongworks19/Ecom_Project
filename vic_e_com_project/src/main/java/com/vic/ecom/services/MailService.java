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
    @Async
    public void sendShipperLocked(String to, String fullName, String reason) {
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(from);
            msg.setTo(to);
            msg.setSubject("Tài khoản Shipper VIC MART đã bị khóa");
            String detail = reason == null || reason.isBlank()
                    ? "Quản trị viên không cung cấp lý do cụ thể."
                    : reason.trim();
            msg.setText("Xin chào " + fullName + ",\n\n"
                    + "Tài khoản Shipper VIC MART của bạn đã được tạm khóa.\n"
                    + "Lý do: " + detail + "\n\n"
                    + "Vui lòng liên hệ quản trị viên để được hỗ trợ.");
            mailSender.send(msg);
        } catch (Exception e) {
            log.error("Failed to send shipper lock mail to {}", to, e);
        }
    }

    @Async
    public void sendAccountDeleted(String to, String fullName, String role, String reason) {
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(from);
            msg.setTo(to);
            msg.setSubject("Tài khoản VICMART đã bị xóa vĩnh viễn");
            msg.setText("Xin chào " + (fullName == null ? "bạn" : fullName) + ",\n\n"
                    + "Tài khoản VICMART của bạn (vai trò: " + role + ") đã bị xóa vĩnh viễn.\n"
                    + "Lý do: " + reason.trim() + "\n\n"
                    + "Nếu bạn cho rằng đây là nhầm lẫn, vui lòng liên hệ quản trị viên.");
            mailSender.send(msg);
        } catch (Exception e) {
            log.error("Failed to send account-deleted mail to {}", to, e);
        }
    }
}
