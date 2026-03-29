package org.sport.backend.serviceImpl;

import lombok.RequiredArgsConstructor;
import org.sport.backend.dto.base.PageResponse;
import org.sport.backend.constant.CourtCopyStatus;
import org.sport.backend.dto.request.court_copy.CourtCopyRequest;
import org.sport.backend.dto.request.court_copy.CourtCopyUpdateRequest;
import org.sport.backend.dto.response.courtCopy.CourtCopyResponse;
import org.sport.backend.dto.response.slot.SlotResponse;
import org.sport.backend.entity.Court;
import org.sport.backend.entity.CourtCopy;
import org.sport.backend.exception.AppException;
import org.sport.backend.exception.ErrorCode;
import org.sport.backend.repository.CourtCopyRepository;
import org.sport.backend.repository.CourtRepository;
import org.sport.backend.repository.SlotRepository;
import org.sport.backend.entity.Slot;
import org.sport.backend.service.CourtCopyService;
import org.sport.backend.specification.CourtCopySpecification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CourCopyServiceImpl implements CourtCopyService {

    private final CourtRepository courtRepository;
    private final CourtCopyRepository courtCopyRepository;
    private final SlotRepository slotRepository;

    @Override
    public CourtCopyResponse createCourt(CourtCopyRequest copyRequest) {

        Court court = courtRepository.findById(copyRequest.getCourtId())
                .orElseThrow(() -> new AppException(ErrorCode.COURT_NOT_FOUND));

        CourtCopy courtCopy = CourtCopy.builder()
                .courtCode(copyRequest.getCourtCode())
                .courtCopyStatus(CourtCopyStatus.ACTIVE)
                .court(court)
                .build();

        courtCopyRepository.save(courtCopy);
        court.getCourtCopies().add(courtCopy);
        courtRepository.save(court);

        return CourtCopyResponse.builder()
                .courtCopyId(courtCopy.getCourtCopyId())
                .courtCode(courtCopy.getCourtCode())
                .status(courtCopy.getCourtCopyStatus())
                .build();
    }

    @Override
    public PageResponse<CourtCopyResponse> getCourtCopies(
            int page,
            int size,
            String keyword,
            CourtCopyStatus status,
            LocalDateTime fromDate,
            LocalDateTime toDate
    ) {

        Pageable pageable = PageRequest.of(page - 1, size);

        Specification<CourtCopy> spec =
                CourtCopySpecification.filter(keyword, status, fromDate, toDate, null);

        Page<CourtCopy> courtPage = courtCopyRepository.findAll(spec, pageable);

        List<CourtCopyResponse> responses = courtPage
                .getContent()
                .stream()
                .map(this::mapToResponse)
                .toList();

        return PageResponse.<CourtCopyResponse>builder()
                .currentPage(courtPage.getNumber())
                .pageSize(courtPage.getSize())
                .totalPages(courtPage.getTotalPages())
                .totalElements(courtPage.getTotalElements())
                .data(responses)
                .build();
    }

    @Override
    public PageResponse<CourtCopyResponse> getOwnerCourts(
            UUID ownerId,
            int page,
            int size
    ) {

        Pageable pageable = PageRequest.of(page - 1, size);

        Specification<CourtCopy> spec =
                CourtCopySpecification.filter(null, null, null, null, ownerId);

        Page<CourtCopy> courtPage = courtCopyRepository.findAll(spec, pageable);

        List<CourtCopyResponse> responses = courtPage
                .getContent()
                .stream()
                .map(this::mapToResponse)
                .toList();

        return PageResponse.<CourtCopyResponse>builder()
                .currentPage(courtPage.getNumber())
                .pageSize(courtPage.getSize())
                .totalPages(courtPage.getTotalPages())
                .totalElements(courtPage.getTotalElements())
                .data(responses)
                .build();
    }

    @Override
    public CourtCopyResponse getCourtCopyById(UUID courtCopyId) {

        CourtCopy courtCopy = courtCopyRepository.findById(courtCopyId)
                .orElseThrow(() -> new RuntimeException("Court copy not found"));

        return mapToResponse(courtCopy);
    }

    @Override
    public boolean checkAvailability(UUID courtCopyId, LocalDateTime start, LocalDateTime end, UUID excludeSlotId) {
        List<Slot> conflicts = slotRepository.findConflictSlot(courtCopyId, start, end);
        if (excludeSlotId != null) {
            conflicts = conflicts.stream().filter(s -> !s.getSlotId().equals(excludeSlotId)).toList();
        }
        return conflicts.isEmpty();
    }

    @Override
    public CourtCopyResponse updateCourtCopy(UUID courtCopyId, CourtCopyUpdateRequest request) {

        CourtCopy courtCopy = courtCopyRepository.findById(courtCopyId)
                .orElseThrow(() -> new RuntimeException("Court copy not found"));

        courtCopy.setCourtCode(request.getCourtCode());
        courtCopy.setCourtCopyStatus(request.getStatus());

        courtCopyRepository.save(courtCopy);

        return mapToResponse(courtCopy);
    }

    private CourtCopyResponse mapToResponse(CourtCopy courtCopy) {

        List<SlotResponse> slots = courtCopy.getSlots()
                .stream()
                .map(slot -> SlotResponse.builder()
                        .slotId(slot.getSlotId())
                        .courtCopyId(courtCopy.getCourtCopyId())
                        .courtCode(courtCopy.getCourtCode())
                        .startTime(slot.getStartTime())
                        .endTime(slot.getEndTime())
                        .price(slot.getPrice())
                        .slotStatus(slot.getSlotStatus())
                        .build())
                .toList();

        return CourtCopyResponse.builder()
                .courtCopyId(courtCopy.getCourtCopyId())
                .courtCode(courtCopy.getCourtCode())
                .status(courtCopy.getCourtCopyStatus())
                .slots(slots)
                .build();
    }

    @Override
    public List<CourtCopyResponse> getCourtCopiesByRentalArea(UUID rentalAreaId) {

        List<CourtCopy> courtCopies =
                courtCopyRepository.findByRentalAreaId(rentalAreaId);

        return courtCopies.stream()
                .map(this::mapToResponse)
                .toList();
    }
}
