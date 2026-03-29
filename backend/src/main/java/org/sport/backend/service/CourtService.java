package org.sport.backend.service;

import org.sport.backend.dto.base.PageResponse;
import org.sport.backend.constant.CourtStatus;
import org.sport.backend.dto.request.court.CourtRequest;
import org.sport.backend.dto.request.court.CourtUpdateRequest;
import org.sport.backend.dto.response.court.CourtResponse;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface CourtService {

    CourtResponse createCourt(CourtRequest request, List<MultipartFile> images);

    PageResponse<CourtResponse> getAllCourts(
            int page,
            int size,
            String keyword,
            CourtStatus status,
            LocalDateTime fromDate,
            LocalDateTime toDate
    );

    PageResponse<CourtResponse> getMyCourts(
            int page,
            int size,
            String keyword,
            CourtStatus status,
            LocalDateTime fromDate,
            LocalDateTime toDate
    );

    CourtResponse updateCourt(UUID courtId, CourtUpdateRequest request, List<MultipartFile> images);

    CourtResponse getCourtById(UUID courtId);

    PageResponse<CourtResponse> getCourtsByRentalArea(UUID rentalAreaId, int page, int size, String keyword);

    void deleteCourt(UUID courtId);

}
