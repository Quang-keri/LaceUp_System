package org.sport.backend.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.sport.backend.dto.base.ApiResponse;
import org.sport.backend.dto.request.match.MatchResultRequest;
import org.sport.backend.dto.request.match.ReportRequest;
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
            @RequestBody MatchResultRequest request
    ) {
        return ResponseEntity.ok(
                ApiResponse.success(
                        200,
                        "Gửi kết quả thành công, chờ đối thủ xác nhận!",
                        matchResultService.submitResult(request)));
    }

    @PostMapping("/report")
    public ResponseEntity<ApiResponse<Void>> submitMatchReport(
            @RequestBody ReportRequest request
    ) {
        matchResultService.createMatchReport(request);

        return ResponseEntity.ok(
                ApiResponse.success(
                        203,
                        "Gửi báo cáo thành công, chờ chủ sân xác nhận.",
                        null));
    }

    @PostMapping("/report/{reportId}/resolve")
    @PreAuthorize("hasAuthority('VIEW_OWNER_MATCHES')")
    public ResponseEntity<ApiResponse<Void>> resolveMatchReport(
            @PathVariable UUID reportId,
            @RequestParam boolean isAccepted
    ) {
        matchResultService.resolveMatchReport(reportId, isAccepted);
        String msg = isAccepted ? "Đã xác nhận báo cáo, trận đấu bị hủy và sân đã được làm trống!"
                : "Đã từ chối báo cáo vi phạm.";
        return ResponseEntity.ok(
                ApiResponse.success(
                        200,
                        msg,
                        null)
        );
    }

    @PostMapping("/{resultId}/respond")
    @PreAuthorize("hasAuthority('RESPOND_MATCH_RESULT')")
    public ResponseEntity<ApiResponse<MatchResultResponse>> respondToResult(
            @PathVariable UUID resultId,
            @RequestParam boolean isAccepted
    ) {
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