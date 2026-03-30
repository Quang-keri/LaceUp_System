package org.sport.backend.serviceImpl;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.sport.backend.dto.request.user.CreateUserRequest;
import org.sport.backend.entity.mongo.TemporaryRegistration;
import org.sport.backend.exception.AppException;
import org.sport.backend.exception.ErrorCode;
import org.sport.backend.repository.UserRepository;
import org.sport.backend.repository.mongo.TemporaryRegistrationRepository;
import org.sport.backend.service.EmailService;
import org.springframework.boot.autoconfigure.mail.MailProperties;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Random;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements EmailService {

    private final UserRepository userRepository;
    private final JavaMailSender javaMailSender;
    private final MailProperties mailProperties;
    private final TemporaryRegistrationRepository temporaryRegistrationRepository;

    @Override
    public void sendResetPasswordEmail(String toEmail, String resetUrl) {
        try {

            String subject = "Yêu cầu đặt lại mật khẩu - Rent Room App";
            String text = "Chào bạn,\n\n"
                    + "Bạn vừa yêu cầu đặt lại mật khẩu. Vui lòng nhấn vào link bên dưới để tiếp tục:\n\n"
                    + resetUrl + "\n\n"
                    + "Link này sẽ hết hạn sau 15 phút.\n"
                    + "Nếu bạn không yêu cầu, vui lòng bỏ qua email này.";


            sendEmail(toEmail, subject, text);
            log.info("Đã gửi email reset password thành công tới: {}", toEmail);

        } catch (Exception e) {
            log.error("Lỗi khi gửi email: ", e);
        }
    }

    @Override
    public void sendOtpRegister(CreateUserRequest user) {

        if (userRepository.existsByEmail(user.getEmail())) {
            throw new AppException(ErrorCode.USER_EXISTED);
        }

        String otp = String.format("%06d", new Random().nextInt(999999));

        TemporaryRegistration temp = TemporaryRegistration.builder()
                .email(user.getEmail())
                .userRequest(user)
                .otp(otp)
                .createdAt(LocalDateTime.now()) // Dùng cho TTL index tự động xóa
                .build();

        temporaryRegistrationRepository.save(temp);
        log.info(">>> Đã lưu user tạm vào MongoDB: {}", user.getEmail());

        sendEmailVerification(user.getEmail(), user.getUserName(), otp);
    }

    @Async
    @Override
    public void sendEmailVerification(String toEmail, String name, String otp) {

        String confirmUrl = "http://localhost:5173/register/confirm?email=" + toEmail + "&otp=" + otp;

        String subject = "Xác nhận đăng ký tài khoản RentRoom";

        String content = """
                 <!DOCTYPE html>
                 <html lang="vi">
                 <head>
                     <meta charset="UTF-8">
                     <style>
                \s
                         .email-container { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; }
                         .btn-confirm {\s
                             display: inline-block; padding: 15px 30px; margin: 20px 0;\s
                             background-color: #4da6ff; color: #ffffff !important;\s
                             text-decoration: none; border-radius: 8px; font-weight: bold;\s
                         }
                         .footer { font-size: 12px; color: #888; margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px; }
                     </style>
                 </head>
                 <body>
                     <div class="email-container">
                         <h1>Xin chào, %s!</h1>
                         <p>Cảm ơn bạn đã đăng ký thành viên tại <strong>RentRoom</strong>.</p>
                         <p>Vui lòng nhấn vào nút bên dưới để hoàn tất quá trình xác thực tài khoản:</p>
                \s
                         <div style="text-align: center;">
                             <a href="%s" class="btn-confirm">XÁC NHẬN ĐĂNG KÝ NGAY</a>
                         </div>
                \s
                         <p>Nếu nút trên không hoạt động, bạn có thể copy và dán đường link này vào trình duyệt:</p>
                         <p style="word-break: break-all; color: #4da6ff;">%s</p>
                \s
                         <p>Lưu ý: Liên kết này sẽ hết hạn sau <strong>5 phút</strong>.</p>
                         <div class="footer">© 2026 RentRoom - Kết nối tri thức 💗</div>
                     </div>
                 </body>
                 </html>
                \s""".formatted(name, confirmUrl, confirmUrl);

        sendEmail(toEmail, subject, content);
    }

    @Override
    public CreateUserRequest verifyAndGetPendingUser(String email, String otp) {
        // 1. Tìm trong Mongo
        TemporaryRegistration temp = temporaryRegistrationRepository.findById(email)
                .orElseThrow(() -> new RuntimeException("Yêu cầu xác thực không tồn tại hoặc đã hết hạn."));

        // 2. Kiểm tra OTP
        if (!temp.getOtp().equals(otp)) {
            throw new RuntimeException("Mã xác thực không chính xác.");
        }

        // 3. Trả về data (KHÔNG xóa ở đây để tránh lỗi 404 khi Controller gặp sự cố SQL)
        return temp.getUserRequest();
    }

    @Override
    public void deletePendingUser(String email) {
        temporaryRegistrationRepository.deleteById(email);
    }

    private void sendEmail(String to, String subject, String content) {
        log.info(">>> [MAIL_START] Đang chuẩn bị gửi email tới: {}", to);

        MimeMessage message = javaMailSender.createMimeMessage();
        try {
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            String fromEmail = mailProperties.getUsername();
            if (fromEmail == null) {
                log.error(">>> [MAIL_ERROR] Cấu hình spring.mail.username đang bị trống!");
                return;
            }

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(content, true);

            log.info(">>> [MAIL_CONNECT] Đang kết nối tới SMTP Server: {}:{}",
                    mailProperties.getHost(), mailProperties.getPort());

            // Đo thời gian gửi để xác định mức độ nghẽn mạng
            long startTime = System.currentTimeMillis();
            javaMailSender.send(message);
            long endTime = System.currentTimeMillis();

            log.info(">>> [MAIL_SUCCESS] Gửi thành công tới {}. Thời gian xử lý: {}ms", to, (endTime - startTime));

        } catch (org.springframework.mail.MailSendException e) {
            log.error(">>> [MAIL_TIMEOUT_ERROR] Không thể kết nối tới server SMTP. Kiểm tra lại Port (587/465) và App Password.");
            log.error(">>> Chi tiết lỗi: {}", e.getMessage());
        } catch (Exception e) {
            log.error(">>> [MAIL_FATAL_ERROR] Lỗi hệ thống khi xử lý email: ", e);
        }
    }

    @Override
    @Async
    public void sendEmailToReporter(String userName, String reporterEmail, String content) {
        try {


            MimeMessage message = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(reporterEmail);
            helper.setSubject("Phản hồi báo cáo vi phạm");
            String plainText = "Xin chào " + userName + "\n" +
                    "Chúng tôi đã nhận được báo cáo vi phạm của bạn \n"
                    + content + "\n\n" +
                    "Email: " + mailProperties.getUsername() + "\n\n" +
                    "Trân trọng,\n" +
                    "Hệ thống EduRoom";

            String htmlText = """
                      <div class="email-response">
                         <h3>Xin chào %s</h3>
                         <h3>Chúng tôi đã nhận được báo cáo vi phạm của bạn</h3>
                         <p>
                            %s\s
                         </p>
                      </div>
                    \s""".formatted(userName, content);
            helper.setText(plainText, htmlText);
            assert mailProperties.getUsername() != null;
            helper.setFrom(mailProperties.getUsername());
            javaMailSender.send(message);
        } catch (MessagingException e) {
            log.error(e.getMessage());
        }


    }
}
