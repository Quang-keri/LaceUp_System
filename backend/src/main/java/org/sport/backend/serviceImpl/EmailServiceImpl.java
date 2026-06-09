package org.sport.backend.serviceImpl;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.sport.backend.dto.request.user.CreateUserRequest;
import org.sport.backend.entity.mongo.TemporaryRegistration;
import org.sport.backend.exception.AppException;
import org.sport.backend.exception.ErrorCode;
import org.sport.backend.properties.UrlProperties;
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
    private final TemporaryRegistrationRepository temporaryRegistrationRepository;

    private final JavaMailSender javaMailSender;

    private final MailProperties mailProperties;
    private final UrlProperties urlProperties;

    @Override
    public void sendResetPasswordEmail(String toEmail, String resetUrl) {
        try {

            String subject = "Yêu cầu đặt lại mật khẩu - Lace Up";
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
                .createdAt(LocalDateTime.now())
                .build();

        temporaryRegistrationRepository.save(temp);
        log.info(">>> Đã lưu user tạm vào MongoDB: {}", user.getEmail());

        sendEmailVerification(user.getEmail(), user.getUserName(), otp);
    }

    @Override
    public void resendRegisterOtp(String email) {
        TemporaryRegistration temp = temporaryRegistrationRepository.findById(email)
                .orElseThrow(() -> new RuntimeException("Yêu cầu xác thực không tồn tại hoặc đã hết hạn."));

        if (userRepository.existsByEmail(email)) {
            throw new AppException(ErrorCode.USER_EXISTED);
        }

        String newOtp = String.format("%06d", new Random().nextInt(1_000_000));

        temp.setOtp(newOtp);
        temp.setCreatedAt(LocalDateTime.now());

        temporaryRegistrationRepository.save(temp);

        String userName = temp.getUserRequest().getUserName();

        sendEmailVerification(email, userName, newOtp);


    }

    @Async
    @Override
    public void sendEmailVerification(String toEmail, String name, String otp) {

        String confirmUrl = urlProperties.getFrontend()
                + "/register/confirm?email=" + toEmail
                + "&otp=" + otp;

        String subject = "Xác nhận đăng ký tài khoản LaceUp";

        String content = """
             <!DOCTYPE html>
             <html lang="vi">
             <head>
                 <meta charset="UTF-8">
                 <style>
                     .email-container {
                         font-family: Arial, sans-serif;
                         line-height: 1.6;
                         color: #333;
                         max-width: 600px;
                         margin: 0 auto;
                         padding: 24px;
                         border: 1px solid #eee;
                         border-radius: 12px;
                         background-color: #ffffff;
                     }

                     .brand {
                         color: #9156F1;
                         font-weight: bold;
                     }

                     .otp-box {
                         text-align: center;
                         margin: 24px 0;
                         padding: 18px;
                         border-radius: 12px;
                         background-color: #F4EEFF;
                         border: 1px solid #D9C7FF;
                     }

                     .otp-label {
                         font-size: 14px;
                         color: #666;
                         margin-bottom: 8px;
                     }

                     .otp-code {
                         font-size: 34px;
                         font-weight: bold;
                         letter-spacing: 8px;
                         color: #9156F1;
                     }

                     .btn-confirm {
                         display: inline-block;
                         padding: 15px 30px;
                         margin: 20px 0;
                         background-color: #9156F1;
                         color: #ffffff !important;
                         text-decoration: none;
                         border-radius: 8px;
                         font-weight: bold;
                     }

                     .note {
                         background-color: #FFF7ED;
                         border: 1px solid #FDBA74;
                         color: #9A3412;
                         padding: 12px;
                         border-radius: 10px;
                         font-size: 14px;
                     }

                     .footer {
                         font-size: 12px;
                         color: #888;
                         margin-top: 30px;
                         border-top: 1px solid #eee;
                         padding-top: 10px;
                     }
                 </style>
             </head>
             <body>
                 <div class="email-container">
                     <h2>Xin chào, %s!</h2>

                     <p>Cảm ơn bạn đã đăng ký tài khoản tại <span class="brand">LaceUp</span>.</p>

                     <p>Bạn có thể xác thực tài khoản bằng một trong hai cách bên dưới:</p>

                     <div class="otp-box">
                         <div class="otp-label">Mã OTP dùng để xác thực trên ứng dụng LaceUp</div>
                         <div class="otp-code">%s</div>
                     </div>

                     <p>
                         Nếu bạn đang đăng ký trên <strong>ứng dụng mobile</strong>,
                         hãy nhập mã OTP phía trên vào màn hình xác thực trong app.
                     </p>

                     <div style="text-align: center;">
                         <a href="%s" class="btn-confirm">XÁC NHẬN TRÊN WEB</a>
                     </div>

                     <p>
                         Nếu bạn đang đăng ký trên <strong>website</strong>,
                         hãy bấm nút phía trên để hoàn tất đăng ký.
                     </p>

                     <p>Nếu nút trên không hoạt động, bạn có thể copy và dán đường link này vào trình duyệt:</p>

                     <p style="word-break: break-all; color: #9156F1;">%s</p>

                     <div class="note">
                         Lưu ý: Mã OTP và liên kết xác thực sẽ hết hạn sau <strong>5 phút</strong>.
                         Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.
                     </div>

                     <div class="footer">© 2026 LaceUp</div>
                 </div>
             </body>
             </html>
            """.formatted(name, otp, confirmUrl, confirmUrl);

        sendEmail(toEmail, subject, content);
    }

    @Override
    public CreateUserRequest verifyAndGetPendingUser(String email, String otp) {
        TemporaryRegistration temp = temporaryRegistrationRepository.findById(email)
                .orElseThrow(() -> new RuntimeException("Yêu cầu xác thực không tồn tại hoặc đã hết hạn."));

        if (!temp.getOtp().equals(otp)) {
            throw new RuntimeException("Mã xác thực không chính xác.");
        }

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
