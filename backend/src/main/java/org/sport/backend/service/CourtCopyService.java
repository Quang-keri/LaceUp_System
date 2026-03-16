package org.sport.backend.service;

import org.sport.backend.base.PageResponse;
import org.sport.backend.constant.CourtCopyStatus;
import org.sport.backend.dto.request.court_copy.CourtCopyRequest;
import org.sport.backend.dto.request.court_copy.CourtCopyUpdateRequest;
import org.sport.backend.dto.response.courtCopy.CourtCopyResponse;

import java.time.LocalDateTime;
import java.util.UUID;

public interface CourtCopyService {

 CourtCopyResponse createCourt(CourtCopyRequest copyRequest);

    PageResponse<CourtCopyResponse> getCourtCopies(
            int page,
            int size,
            String keyword,
            CourtCopyStatus status,
            LocalDateTime fromDate,
            LocalDateTime toDate
    );

    PageResponse<CourtCopyResponse> getOwnerCourts(
            UUID ownerId,
            int page,
            int size
    );

    CourtCopyResponse getCourtCopyById(UUID courtCopyId);

    CourtCopyResponse updateCourtCopy(UUID courtCopyId, CourtCopyUpdateRequest request);
}
