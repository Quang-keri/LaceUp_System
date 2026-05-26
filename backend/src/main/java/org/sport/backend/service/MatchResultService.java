package org.sport.backend.service;

import jakarta.transaction.Transactional;
import org.sport.backend.dto.request.match.MatchResultRequest;
import org.sport.backend.dto.request.match.ReportRequest;
import org.sport.backend.dto.response.match.MatchResultResponse;

import java.util.List;
import java.util.UUID;

public interface MatchResultService {
    MatchResultResponse submitResult(MatchResultRequest request);
    MatchResultResponse respondToResult(UUID resultId, boolean isAccepted);

    @Transactional
    void createMatchReport(ReportRequest request);

    @Transactional
    void resolveMatchReport(UUID reportId, boolean isAccepted);

    List<MatchResultResponse> getResultsByMatch(UUID matchId);
}