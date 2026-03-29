package org.sport.backend.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.sport.backend.dto.base.ApiResponse;
import org.sport.backend.dto.base.PageResponse;
import org.sport.backend.constant.MatchStatus;
import org.sport.backend.constant.MatchType;
import org.sport.backend.dto.request.match.MatchRequest;
import org.sport.backend.dto.response.match.MatchResponse;
import org.sport.backend.service.MatchService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/matches")
@RequiredArgsConstructor
@Tag(name = "13. Match")
@Slf4j
public class MatchController {

    private final MatchService matchService;

    @PostMapping("/create")
    @PreAuthorize("hasAuthority('CREATE_MATCH')")
    public ResponseEntity<ApiResponse<MatchResponse>> createMatch(
            @RequestBody @Valid MatchRequest request) {
        log.info("Request nhận được: isRecurring={}, type={}, days={}",
                request.isRecurring(), request.getRecurringType(), request.getDayOfWeek());
        return ResponseEntity.ok(
                ApiResponse.success(
                        200,
                        "Tạo trận vãng lai thành công",
                        matchService.createMatch(request)));
    }

    @PostMapping("/{matchId}/join")
    @PreAuthorize("hasAuthority('JOIN_MATCH')")
    public ResponseEntity<ApiResponse<Void>> joinMatch(
            @PathVariable UUID matchId) {
        matchService.joinMatch(matchId);
        return ResponseEntity.ok(ApiResponse.success(
                200,
                "Bạn đã tham gia trận đấu thành công!",
                null));
    }

    @PostMapping("/{matchId}/confirm-deposit")
    @PreAuthorize("hasAuthority('CONFIRM_MATCH_DEPOSIT')")
    public ResponseEntity<ApiResponse<Void>> confirmDeposit(
            @PathVariable UUID matchId) {
        matchService.confirmDeposit(matchId);
        return ResponseEntity.ok(ApiResponse.success(
                200,
                "Đã xác nhận cọc thành công! Chờ người chơi còn lại xác nhận.",
                null));
    }

    @GetMapping("/open")
    public ResponseEntity<ApiResponse<List<MatchResponse>>> getOpenMatches() {
        return ResponseEntity.ok(
                ApiResponse.success(200,
                        "Lấy danh sách trận đấu đang mở thành công.",
                        matchService.getOpenMatches()));
    }

    @GetMapping("/{matchId}")
    public ResponseEntity<ApiResponse<MatchResponse>> getMatchDetail(
            @PathVariable UUID matchId) {
        return ResponseEntity.ok(
                ApiResponse.success(
                        200,
                        "Lấy thông tin trận đấu thành công.",
                        matchService.getMatchDetail(matchId)));
    }

    @GetMapping
    @PreAuthorize("hasAuthority('VIEW_ALL_MATCHES')")
    public ResponseEntity<ApiResponse<PageResponse<MatchResponse>>> getAllMatches(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) MatchStatus status,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) LocalDateTime startDate,
            @RequestParam(required = false) LocalDateTime endDate,
            @RequestParam(required = false) MatchType matchType
    ) {
        PageResponse<MatchResponse> result = matchService.getAllMatches(
                page, size, status, category, keyword, startDate, endDate, matchType);
        return ResponseEntity.ok(
                ApiResponse.success(
                        200,
                        "Lấy tất cả trận đấu thành công.",
                        result));
    }

    @GetMapping("/owner")
    @PreAuthorize("hasAuthority('VIEW_OWNER_MATCHES')")
    public ResponseEntity<ApiResponse<PageResponse<MatchResponse>>> getOwnerMatches(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(
                ApiResponse.success(
                        200,
                        "Lấy danh sách trận đấu trên sân của owner thành công.",
                        matchService.getOwnerMatchesPaged(page, size)));
    }

    @GetMapping("/my-matches")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PageResponse<MatchResponse>>> getMyMatches(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(
                ApiResponse.success(
                        200,
                        "Lấy danh sách trận đấu của tôi thành công.",
                        matchService.getMyMatches(page, size))
        );
    }

    @GetMapping("/user/{userId}/history")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PageResponse<MatchResponse>>> getUserMatchHistory(
            @PathVariable UUID userId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(
                ApiResponse.success(200,
                        "Lấy danh sách trận đấu của người chơi thành công.",
                        matchService.getUserMatchHistory(userId, page, size))
        );
    }

}