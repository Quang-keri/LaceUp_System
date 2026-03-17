package org.sport.backend.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.sport.backend.base.ApiResponse;
import org.sport.backend.base.PageResponse;
import org.sport.backend.constant.MatchStatus;
import org.sport.backend.dto.request.match.MatchRequest;
import org.sport.backend.dto.response.match.MatchResponse;
import org.sport.backend.entity.User;
import org.sport.backend.service.MatchService;
import org.sport.backend.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/matches")
@RequiredArgsConstructor
@Tag(name = "13. Match")
public class MatchController {

    private final MatchService matchService;
    private final UserService userService;

    @PostMapping("/create")
    public ResponseEntity<ApiResponse<MatchResponse>> createMatch(
            @RequestBody MatchRequest request) {
        User host = userService.getCurrentUserEntity();
        return ResponseEntity.ok(
                ApiResponse.success(
                        "Tạo trận vãng lai thành công",
                        matchService.createMatch(request, host)));
    }

    @PostMapping("/{matchId}/join")
    public ResponseEntity<ApiResponse<String>> joinMatch(
            @PathVariable UUID matchId) {
        User user = userService.getCurrentUserEntity();
        matchService.joinMatch(matchId, user);

        return ResponseEntity.ok(ApiResponse.success(
                "Bạn đã tham gia trận đấu thành công!", null));
    }

    @GetMapping("/open")
    public ResponseEntity<ApiResponse<List<MatchResponse>>> getOpenMatches() {
        return ResponseEntity.ok(
                ApiResponse.success(matchService.getOpenMatches()));
    }

    @GetMapping("/{matchId}")
    public ResponseEntity<ApiResponse<MatchResponse>> getMatchDetail(
            @PathVariable UUID matchId) {
        return ResponseEntity.ok(
                ApiResponse.success(matchService.getMatchDetail(matchId)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<MatchResponse>>> getAllMatches(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) MatchStatus status,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) LocalDateTime startDate,
            @RequestParam(required = false) LocalDateTime endDate
    ) {
        PageResponse<MatchResponse> result = matchService.getAllMatches(
                page, size, status, category, keyword, startDate, endDate);

        return ResponseEntity.ok(ApiResponse.success(result));
    }
}