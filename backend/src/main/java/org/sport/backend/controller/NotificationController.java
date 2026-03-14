package org.sport.backend.controller;

import lombok.RequiredArgsConstructor;
import org.sport.backend.base.ApiResponse;
import org.sport.backend.dto.response.notification.NotificationResponse;
import org.sport.backend.service.NotificationService;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping("/my-notification")
    public ResponseEntity<ApiResponse<Page<NotificationResponse>>> getMyNotification(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        return ResponseEntity.ok(ApiResponse.<Page<NotificationResponse>>builder()
                .code(200)
                .result(notificationService.getMyNotification(page, size))
                .message("Get my notification successful")
                .build());
    }
}
