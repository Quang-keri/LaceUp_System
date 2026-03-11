package org.sport.backend.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.sport.backend.base.ApiResponse;
import org.sport.backend.dto.request.auth.LoginGoogleRequest;
import org.sport.backend.dto.request.auth.LoginRequest;
import org.sport.backend.dto.request.user.CreateUserRequest;
import org.sport.backend.dto.response.auth.LoginGoogleResponse;
import org.sport.backend.dto.response.auth.LoginResponse;
import org.sport.backend.service.AuthGoogleService;
import org.sport.backend.service.AuthService;
import org.sport.backend.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/v1/auth")
@Tag(name = "1. Authentication")
public class AuthController {

    private final AuthService authService;
    private final AuthGoogleService authGoogleService;
    UserService userService;
//    EmailService emailService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(
            @Valid @RequestBody LoginRequest request
    ) {
        System.out.println(request.getEmail());
        LoginResponse loginResponse = authService.login(request);
        System.out.println(loginResponse);
        return ResponseEntity.ok(ApiResponse.<LoginResponse>builder()
                .code(200)
                .message("Login successfully")
                .result(loginResponse)
                .build());
    }

    @PostMapping("/google")
    public ResponseEntity<ApiResponse<LoginResponse>> loginGoogle(
            @Valid @RequestBody LoginGoogleRequest request
    ) {
        LoginGoogleResponse googleInfo = authGoogleService.authenticate(request.getCode());

        LoginResponse tokens = authService.loginWithGoogle(
                googleInfo.getEmail(),
                googleInfo.getName(),
                googleInfo.getId()
        );

        return ResponseEntity.ok(ApiResponse.<LoginResponse>builder()
                .code(200)
                .message("Google Login successfully")
                .result(tokens)
                .build());
    }

//    @PostMapping("/refresh")
//    public ResponseEntity<ApiResponse<LoginResponse>> refresh(
//            HttpServletRequest request) {
//
//        LoginResponse newTokens = authService.refresh(request);
//        return ResponseEntity.ok(ApiResponse.<LoginResponse>builder()
//                .code(200)
//                .message("Refresh successfully")
//                .result(newTokens)
//                .build());
//    }

//    @PostMapping("/register/request")
//    public ResponseEntity<ApiResponse<?>> sendOtp(
//            @Valid @RequestBody CreateUserRequest user
//    ) {
//        emailService.sendOtpRegister(user);
//
//        return ResponseEntity.ok(
//                ApiResponse.<Void>builder()
//                        .code(200)
//                        .message("Mã xác thực đã được gửi tới email của bạn.")
//                        .build()
//        );
//    }
//
//    @GetMapping("/register/confirm")
//    public ResponseEntity<ApiResponse<?>> confirmRegister(
//            @RequestParam String email,
//            @RequestParam String otp) {
//
//        CreateUserRequest userRequest = emailService.verifyAndGetPendingUser(email, otp);
//
//        userService.createUser(userRequest);
//
//        return ResponseEntity.ok(
//                ApiResponse.<Void>builder()
//                        .code(200)
//                        .message("Đăng ký tài khoản thành công!")
//                        .build()
//        );
//    }
//
//    @PostMapping("/forgot-password")
//    public ResponseEntity<ApiResponse<?>> forgotPassword(
//            @RequestParam String email
//    ) {
//        userService.processForgotPassword(email);
//        return ResponseEntity.ok(
//                ApiResponse.builder()
//                        .code(200)
//                        .message("Vui lòng kiểm tra email để lấy lại mật khẩu.")
//                        .build()
//        );
//    }
//
//    @PostMapping("/reset-password")
//    public ResponseEntity<ApiResponse<?>> resetPassword(
//            @Valid @RequestBody ResetPasswordRequest request
//    ) {
//        userService.processResetPassword(request);
//        return ResponseEntity.ok(
//                ApiResponse.builder()
//                        .code(200)
//                        .message("Đổi mật khẩu thành công.")
//                        .build()
//        );
//    }
}
