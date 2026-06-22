package org.sport.backend.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.sport.backend.dto.base.ApiResponse;
import org.sport.backend.dto.response.user.LeaderboardEntryResponse;
import org.sport.backend.dto.response.user.MyLeaderboardStatsResponse;
import org.sport.backend.service.LeaderboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/leaderboards")
@RequiredArgsConstructor
@Tag(name = "Leaderboard")
public class LeaderboardController {

    private final LeaderboardService leaderboardService;

    @GetMapping("/{categoryId}/top100")
    public ResponseEntity<ApiResponse<List<LeaderboardEntryResponse>>> getTop100(
            @PathVariable Integer categoryId) {
        return ResponseEntity.ok(
                ApiResponse.<List<LeaderboardEntryResponse>>builder()
                        .code(200)
                        .message("Lấy top 100 thành công")
                        .result(leaderboardService.getTop100ByCategory(categoryId))
                        .build()
        );
    }

    @GetMapping("/{categoryId}/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<MyLeaderboardStatsResponse>> getMyLeaderboardStats(
            @PathVariable Integer categoryId) {
        return ResponseEntity.ok(
                ApiResponse.<MyLeaderboardStatsResponse>builder()
                        .code(200)
                        .message("Lấy thứ hạng cá nhân thành công")
                        .result(leaderboardService.getMyLeaderboardStats(categoryId))
                        .build()
        );
    }

}
