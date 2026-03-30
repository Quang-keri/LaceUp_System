package org.sport.backend.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.sport.backend.dto.base.ApiResponse;
import org.sport.backend.dto.request.match.MatchResultRequest;
import org.sport.backend.dto.response.match.MatchResultResponse;
import org.sport.backend.service.MatchResultService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/match-results")
@RequiredArgsConstructor
@Tag(name = "14. Match Result", description = "Quản lý kết quả trận đấu (Rank, Kèo)")
public class MatchResultController {

    private final MatchResultService matchResultService;

    @PostMapping("/submit")
    @PreAuthorize("hasAuthority('SUBMIT_MATCH_RESULT')")
    public ResponseEntity<ApiResponse<MatchResultResponse>> submitResult(
            @RequestBody MatchResultRequest request) {
        return ResponseEntity.ok(
                ApiResponse.success(
                        200,
                        "Gửi kết quả thành công, chờ đối thủ xác nhận!",
                        matchResultService.submitResult(request)));
    }

    @PostMapping("/{resultId}/respond")
    @PreAuthorize("hasAuthority('RESPOND_MATCH_RESULT')")
    public ResponseEntity<ApiResponse<MatchResultResponse>> respondToResult(
            @PathVariable UUID resultId,
            @RequestParam boolean isAccepted) {
        String msg = isAccepted ? "Xác nhận kết quả thành công!" : "Đã từ chối kết quả, chờ Admin xử lý!";
        return ResponseEntity.ok(
                ApiResponse.success(
                        200,
                        msg,
                        matchResultService.respondToResult(resultId, isAccepted)));
    }

    @GetMapping("/match/{matchId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<MatchResultResponse>>> getResultsByMatch(
            @PathVariable UUID matchId) {
        return ResponseEntity.ok(
                ApiResponse.success(
                        200,
                        "Lấy kết quả trận đấu thành công.",
                        matchResultService.getResultsByMatch(matchId)));
    }

}