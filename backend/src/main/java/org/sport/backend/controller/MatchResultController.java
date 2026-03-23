package org.sport.backend.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.sport.backend.base.ApiResponse;
import org.sport.backend.dto.request.match.MatchResultRequest;
import org.sport.backend.dto.response.match.MatchResultResponse;
import org.sport.backend.service.MatchResultService;
import org.springframework.http.ResponseEntity;
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
    public ResponseEntity<ApiResponse<MatchResultResponse>> submitResult(
            @RequestBody MatchResultRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                "Gửi kết quả thành công, chờ đối thủ xác nhận!",
                matchResultService.submitResult(request)));
    }

    @PostMapping("/{resultId}/respond")
    public ResponseEntity<ApiResponse<MatchResultResponse>> respondToResult(
            @PathVariable UUID resultId,
            @RequestParam boolean isAccepted) {
        MatchResultResponse response = matchResultService.respondToResult(resultId, isAccepted);
        String msg = isAccepted ? "Xác nhận kết quả thành công!" : "Đã từ chối kết quả, chờ Admin xử lý!";
        return ResponseEntity.ok(ApiResponse.success(msg, response));
    }

    @GetMapping("/match/{matchId}")
    public ResponseEntity<ApiResponse<List<MatchResultResponse>>> getResultsByMatch(
            @PathVariable UUID matchId) {
        return ResponseEntity.ok(ApiResponse.success(matchResultService.getResultsByMatch(matchId)));
    }
}