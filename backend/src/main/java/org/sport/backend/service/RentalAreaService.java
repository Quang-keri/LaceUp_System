package org.sport.backend.service;

import org.sport.backend.base.PageResponse;
import org.sport.backend.constant.RentalAreaStatus;
import org.sport.backend.dto.request.rental.RentalAreaRequest;
import org.sport.backend.dto.request.rental.RentalAreaUpdateRequest;
import org.sport.backend.dto.response.rental.RentalAreaDetailResponse;
import org.sport.backend.dto.response.rental.RentalAreaResponse;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface RentalAreaService {
    RentalAreaResponse createRentalArea(RentalAreaRequest request, List<MultipartFile> images);
    PageResponse<RentalAreaResponse> getAllRentalAreas(
            int page,
            int size,
            String keyword,
            UUID cityId,
            RentalAreaStatus status,
            LocalDateTime fromDate,
            LocalDateTime toDate
    );

    PageResponse<RentalAreaResponse> getMyRentalAreas(
            int page,
            int size,
            String keyword,
            RentalAreaStatus status,
            LocalDateTime fromDate,
            LocalDateTime toDate
    );

    RentalAreaResponse updateRentalArea(UUID rentalAreaId, RentalAreaUpdateRequest request);

    RentalAreaDetailResponse getRentalAreaById(UUID rentalAreaId);
}
