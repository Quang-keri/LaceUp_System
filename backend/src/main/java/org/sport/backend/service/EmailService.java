package org.sport.backend.service;

import org.sport.backend.dto.request.user.CreateUserRequest;
import org.springframework.scheduling.annotation.Async;

public interface EmailService {
    void sendResetPasswordEmail(String toEmail, String resetUrl);

    void sendOtpRegister(CreateUserRequest user);

    @Async
    void sendEmailVerification(String toEmail, String name, String otp);

    CreateUserRequest verifyAndGetPendingUser(String email, String otp);

    void deletePendingUser(String email);

    void sendEmailToReporter(String userName, String reporterEmail, String content);
}