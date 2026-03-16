package org.sport.backend.controller;

import lombok.RequiredArgsConstructor;
import org.sport.backend.entity.Match;
import org.sport.backend.entity.User;
import org.sport.backend.service.MatchService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/matches")
@RequiredArgsConstructor
public class MatchController {

    private final MatchService matchService;
    private final MatchMapper matchMapper;

    @PostMapping("/create")
    public ResponseEntity<ApiResponse<MatchResponse>> createMatch(@RequestBody MatchRequest request) {
        User host = getCurrentUser();
        Match match = matchService.createMatch(request, host);

        ApiResponse<MatchResponse> response = ApiResponse.success("Tạo trận vãng lai thành công", matchMapper.toResponse(match));
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{matchId}/join")
    public ResponseEntity<ApiResponse<String>> joinMatch(@PathVariable UUID matchId) {
        User user = getCurrentUser();
        matchService.joinMatch(matchId, user);

        ApiResponse<String> response = ApiResponse.success("Bạn đã tham gia trận đấu thành công!", null);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/open")
    public ResponseEntity<ApiResponse<List<MatchResponse>>> getOpenMatches() {
        List<Match> matches = matchService.getOpenMatches();
        List<MatchResponse> responses = matchMapper.toResponseList(matches);

        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/{matchId}")
    public ResponseEntity<ApiResponse<MatchResponse>> getMatchDetail(@PathVariable UUID matchId) {
        Match match = matchService.getMatchDetail(matchId);

        return ResponseEntity.ok(ApiResponse.success(matchMapper.toResponse(match));
    }

    private User getCurrentUser() {
        // Logic lấy User hiện tại từ SecurityContext
        return new User();
    }
}