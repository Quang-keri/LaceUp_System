package org.sport.backend.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.sport.backend.dto.base.ApiResponse;
import org.sport.backend.dto.response.user.UserAchievementResponse;
import org.sport.backend.service.UserAchievementService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/achievements")
@RequiredArgsConstructor
@Tag(name = "14. Achievement")
@Slf4j
public class UserAchievementController {

    private final UserAchievementService achievementService;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<List<UserAchievementResponse>>> getMyAchievements() {
        log.info("Lấy danh sách thành tựu của user hiện tại");
        return ResponseEntity.ok(
                ApiResponse.success(achievementService.getMyAchievements())
        );
    }

    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponse<List<UserAchievementResponse>>> getUserAchievements(
            @PathVariable UUID userId) {
        log.info("Lấy danh sách thành tựu của user có ID: {}", userId);
        return ResponseEntity.ok(
                ApiResponse.success(achievementService.getUserAchievements(userId))
        );
    }
}