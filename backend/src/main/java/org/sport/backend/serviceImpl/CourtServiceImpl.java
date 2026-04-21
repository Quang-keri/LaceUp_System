package org.sport.backend.serviceImpl;

import org.sport.backend.dto.base.PageResponse;
import org.sport.backend.constant.CourtCopyStatus;
import org.sport.backend.constant.CourtStatus;
import org.sport.backend.dto.internal.CloudinaryUploadResult;
import org.sport.backend.dto.request.court.CourtRequest;
import org.sport.backend.dto.request.court.CourtUpdateRequest;
import org.sport.backend.dto.request.court_copy.CourtCopyRequest;
import org.sport.backend.dto.response.amenity.AmenityResponse;
import org.sport.backend.dto.response.booking.BookingShortResponse;
import org.sport.backend.dto.response.court.CourtImageResponse;
import org.sport.backend.dto.response.court.CourtResponse;
import org.sport.backend.dto.response.courtCopy.CourtCopyResponse;
import org.sport.backend.dto.response.court_price.CourtPriceResponse;
import org.sport.backend.dto.response.slot.SlotResponse;
import org.sport.backend.entity.*;
import org.sport.backend.exception.AppException;
import org.sport.backend.exception.ErrorCode;
import org.sport.backend.repository.*;
import org.sport.backend.service.CloudinaryService;
import org.sport.backend.service.CourtService;
import org.sport.backend.service.UserService;
import org.sport.backend.specification.CourtSpecification;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class CourtServiceImpl implements CourtService {
    @Autowired
    private CourtRepository courtRepository;
    @Autowired
    private CourtCopyRepository courtCopyRepository;
    @Autowired
    private RentalAreaRepository rentalAreaRepository;
    @Autowired
    private CloudinaryService cloudinaryService;
    @Autowired
    private CourtImageRepository courtImageRepository;
    @Autowired
    private UserService userService;
    @Autowired
    private CategoryRepository categoryRepository;
    @Autowired
    private CourtPriceRepository courtPriceRepository;
    @Autowired
    private AmenityRepository amenityRepository;

    @Override
    @Transactional
    public CourtResponse createCourt(CourtRequest request, List<MultipartFile> images) {

        int count = images == null ? 0 :
                (int) images.stream().filter(f -> f != null && !f.isEmpty()).count();

        if (count < 1 || count > 5) {
            throw new IllegalArgumentException("Court yêu cầu 1 tới 5 ảnh");
        }

        RentalArea rentalArea = rentalAreaRepository
                .findById(request.getRentalAreaId())
                .orElseThrow(() -> new AppException(ErrorCode.RENTAL_AREA_NOT_FOUND));


        Category category = categoryRepository.findById(request.getCategoryId()).orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));

        Set<Amenity> amenities = new HashSet<>();
        if (request.getAmenityIds() != null && !request.getAmenityIds().isEmpty()) {
            List<Amenity> found = amenityRepository.findAllById(request.getAmenityIds());
            if (found.size() != request.getAmenityIds().size()) {
                throw new IllegalArgumentException("Some amenities not found");
            }
            amenities.addAll(found);
        }


        Court court = Court.builder()
                .courtName(request.getCourtName())
                .courtStatus(CourtStatus.ACTIVE)
                .category(category)
                .rentalArea(rentalArea)
                .amenities(amenities)
                .build();


        courtRepository.save(court);


        List<CourtCopy> courtCopies = new ArrayList<>();

        for (CourtCopyRequest copyRequest : request.getCourtCopyRequests()) {

            CourtCopy courtCopy = CourtCopy.builder()
                    .courtCode(copyRequest.getCourtCode())
                    .courtCopyStatus(CourtCopyStatus.ACTIVE)
                    .location(copyRequest.getLocation())
                    .court(court)
                    .build();

            courtCopies.add(courtCopy);
        }

        courtCopyRepository.saveAll(courtCopies);
        court.setCourtCopies(courtCopies);

        // upload ảnh
        String folder = "courts/" + court.getCourtId();

        List<CloudinaryUploadResult> uploaded =
                cloudinaryService.uploadImages(images, folder);

        List<CourtImage> entities = new ArrayList<>();

        for (int i = 0; i < uploaded.size(); i++) {

            CloudinaryUploadResult u = uploaded.get(i);

            CourtImage img = CourtImage.builder()
                    .court(court)
                    .imageUrl(u.getUrl())
                    .publicId(u.getPublicId())
                    .isCover(i == 0)
                    .sortOrder(i)
                    .build();

            entities.add(img);
        }

        courtImageRepository.saveAll(entities);
        court.setImages(entities);

        return mapToResponse(court);
    }

    @Override
    public CourtResponse updateCourt(UUID courtId, CourtUpdateRequest request, List<MultipartFile> images) {

        Court court = courtRepository.findById(courtId)
                .orElseThrow(() -> new AppException(ErrorCode.COURT_NOT_FOUND));

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));

        RentalArea rentalArea = rentalAreaRepository.findById(request.getRentalAreaId())
                .orElseThrow(() -> new AppException(ErrorCode.RENTAL_AREA_NOT_FOUND));


        Set<Amenity> amenities = new HashSet<>();

        if (request.getAmenityIds() != null && !request.getAmenityIds().isEmpty()) {
            List<Amenity> found = amenityRepository.findAllById(request.getAmenityIds());

            if (found.size() != request.getAmenityIds().size()) {
                throw new IllegalArgumentException("Some amenities not found");
            }

            amenities.addAll(found);
        }

        court.setAmenities(amenities);


        court.setCourtName(request.getCourtName().trim());
        court.setCategory(category);
        court.setRentalArea(rentalArea);
        court.setCourtStatus(request.getStatus());

        courtRepository.save(court);


        List<CourtCopy> existingCopies = courtCopyRepository.findByCourt(court);

        List<String> requestCodes = request.getCourtCodes();


        List<String> existingCodes = existingCopies
                .stream()
                .map(CourtCopy::getCourtCode)
                .toList();


        for (String code : requestCodes) {

            if (!existingCodes.contains(code)) {

                CourtCopy newCopy = CourtCopy.builder()
                        .court(court)
                        .courtCode(code)
                        .courtCopyStatus(CourtCopyStatus.ACTIVE)
                        .build();

                courtCopyRepository.save(newCopy);
            }
        }

        for (CourtCopy copy : existingCopies) {

            if (!requestCodes.contains(copy.getCourtCode())) {

                courtCopyRepository.delete(copy);
            }
        }


        if (images != null && !images.isEmpty()) {

            int count = (int) images.stream()
                    .filter(f -> f != null && !f.isEmpty())
                    .count();

            if (count < 1 || count > 5) {
                throw new IllegalArgumentException("Court yêu cầu 1 tới 5 ảnh");
            }

            List<CourtImage> oldImages = courtImageRepository.findByCourt(court);

            for (CourtImage img : oldImages) {
                cloudinaryService.deleteByPublicId(img.getPublicId());
            }

            courtImageRepository.deleteAll(oldImages);

            String folder = "courts/" + court.getCourtId();

            List<CloudinaryUploadResult> uploaded =
                    cloudinaryService.uploadImages(images, folder);

            List<CourtImage> newImages = new ArrayList<>();

            for (int i = 0; i < uploaded.size(); i++) {

                CloudinaryUploadResult u = uploaded.get(i);

                CourtImage img = CourtImage.builder()
                        .court(court)
                        .imageUrl(u.getUrl())
                        .publicId(u.getPublicId())
                        .isCover(i == 0)
                        .sortOrder(i)
                        .createdAt(LocalDateTime.now())
                        .build();

                newImages.add(img);
            }

            courtImageRepository.saveAll(newImages);
        }

        return mapToResponse(court);
    }

    @Override
    public PageResponse<CourtResponse> getAllCourts(
            int page,
            int size,
            String keyword,
            CourtStatus status,
            LocalDateTime fromDate,
            LocalDateTime toDate
    ) {

        Pageable pageable = PageRequest.of(
                page - 1,
                size,
                Sort.by("createdAt").descending()
        );

        Specification<Court> spec = Specification
                .where(CourtSpecification.hasKeyword(keyword))
                .and(CourtSpecification.hasStatus(status))
                .and(CourtSpecification.fromDate(fromDate))
                .and(CourtSpecification.toDate(toDate));

        Page<Court> courtPage = courtRepository.findAll(spec, pageable);

        List<CourtResponse> data = courtPage.getContent()
                .stream()
                .map(this::mapToResponse)
                .toList();

        return PageResponse.<CourtResponse>builder()
                .currentPage(courtPage.getNumber())
                .totalPages(courtPage.getTotalPages())
                .pageSize(courtPage.getSize())
                .totalElements(courtPage.getTotalElements())
                .data(data)
                .build();
    }

    @Override
    public PageResponse<CourtResponse> getMyCourts(
            int page,
            int size,
            String keyword,
            CourtStatus status,
            LocalDateTime fromDate,
            LocalDateTime toDate
    ) {

        UUID userId = userService.getMyInfo().getUserId();

        Pageable pageable = PageRequest.of(
                page - 1,
                size,
                Sort.by("createdAt").descending()
        );

        Specification<Court> spec = Specification
                .where(CourtSpecification.ownedBy(userId))
                .and(CourtSpecification.hasKeyword(keyword))
                .and(CourtSpecification.hasStatus(status))
                .and(CourtSpecification.fromDate(fromDate))
                .and(CourtSpecification.toDate(toDate));

        Page<Court> courtPage = courtRepository.findAll(spec, pageable);

        List<CourtResponse> data = courtPage.getContent()
                .stream()
                .map(this::mapToResponse)
                .toList();

        return PageResponse.<CourtResponse>builder()
                .currentPage(courtPage.getNumber())
                .totalPages(courtPage.getTotalPages())
                .pageSize(courtPage.getSize())
                .totalElements(courtPage.getTotalElements())
                .data(data)
                .build();
    }


    private CourtResponse mapToResponse(Court court) {

        List<CourtImage> images =
                courtImageRepository.findByCourt_CourtId(court.getCourtId());

        List<CourtImageResponse> imageResponses = images.stream()
                .sorted(Comparator.comparing(
                        CourtImage::getSortOrder,
                        Comparator.nullsLast(Integer::compareTo)
                ))
                .map(img -> CourtImageResponse.builder()
                        .courtImageId(img.getCourtImageId())
                        .imageUrl(img.getImageUrl())
                        .isCover(img.getIsCover())
                        .sortOrder(img.getSortOrder())
                        .build())
                .toList();
        List<AmenityResponse> amenityResponses = court.getAmenities()
                .stream()
                .map(a -> AmenityResponse.builder()
                        .amenityId(a.getAmenityId())
                        .amenityName(a.getAmenityName())
                        .build())
                .toList();

        List<CourtCopy> courtCopies =
                courtCopyRepository.findByCourt_CourtId(court.getCourtId());

        List<CourtCopyResponse> copyResponses = courtCopies.stream()
                .map(copy -> {
                            List<Slot> slots = copy.getSlots() == null ? List.of() : copy.getSlots();
                            List<SlotResponse> slotResponses = slots.stream().map(
                                    slot -> {

                                        BookingShortResponse bookingRes = null;

                                        if (slot.getBooking() != null) {
                                            bookingRes = BookingShortResponse.builder()
                                                    .bookingId(slot.getBooking().getBookingId())
                                                    .userName(slot.getBooking().getBookerName())
                                                    .userPhone(slot.getBooking().getBookerPhone())
                                                    .note(slot.getBooking().getNote())
                                                    .build();
                                        }

                                        return SlotResponse.builder()
                                                .slotId(slot.getSlotId())
                                                .startTime(slot.getStartTime())
                                                .endTime(slot.getEndTime())
                                                .slotStatus(slot.getSlotStatus())
                                                .bookingShortResponse(bookingRes)
                                                .build();
                                    }).toList();

                            return CourtCopyResponse.builder()
                                    .courtCopyId(copy.getCourtCopyId())
                                    .courtCode(copy.getCourtCode())
                                    .status(copy.getCourtCopyStatus())
                                    .slots(slotResponses)
                                    .build();
                        }
                )
                .toList();

        List<CourtPrice> prices =
                courtPriceRepository.findByCourt_CourtId(court.getCourtId());

        List<CourtPriceResponse> priceResponses = prices.stream()
                .sorted(Comparator.comparing(CourtPrice::getStartTime))
                .map(this::mapToPriceResponse)
                .toList();


        List<Object[]> result = courtPriceRepository.getPriceRange(court.getCourtId());

        BigDecimal minPrice = null;
        BigDecimal maxPrice = null;

        if (result != null && !result.isEmpty()) {
            Object[] range = result.get(0);

            minPrice = range[0] != null ? (BigDecimal) range[0] : null;
            maxPrice = range[1] != null ? (BigDecimal) range[1] : null;
        }


        return CourtResponse.builder()
                .courtId(court.getCourtId())
                .courtName(court.getCourtName())

                .status(court.getCourtStatus())
                .rentalAreaId(court.getRentalArea().getRentalAreaId())
                .minPrice(minPrice)
                .maxPrice(maxPrice)
                .priceRules(priceResponses)
                .images(imageResponses)
                .courtCopies(copyResponses)
                .amenities(amenityResponses)
                .build();
    }

    private CourtPriceResponse mapToPriceResponse(CourtPrice p) {
        return CourtPriceResponse.builder()
                .courtPriceId(p.getCourtPriceId())
                .courtId(p.getCourt().getCourtId())
                .startTime(p.getStartTime())
                .endTime(p.getEndTime())
                .pricePerHour(p.getPricePerHour())
                .specificDate(p.getSpecificDate())
                .priceType(p.getPriceType())
                .priority(p.getPriority())
                .build();
    }

    @Override
    public CourtResponse getCourtById(UUID courtId) {
        Court court = courtRepository.findById(courtId)
                .orElseThrow(() -> new AppException(ErrorCode.COURT_NOT_FOUND));
        return mapToResponse(court);
    }

    @Override
    public PageResponse<CourtResponse> getCourtsByRentalArea(UUID rentalAreaId, int page, int size, String keyword) {
        RentalArea rentalArea = rentalAreaRepository.findById(rentalAreaId)
                .orElseThrow(() -> new AppException(ErrorCode.RENTAL_AREA_NOT_FOUND));

        Pageable pageable = PageRequest.of(page - 1, size, Sort.by("createdAt").descending());
        Specification<Court> spec = Specification
                .where(CourtSpecification.byRentalArea(rentalAreaId))
                .and(CourtSpecification.hasKeyword(keyword));

        Page<Court> courtPage = courtRepository.findAll(spec, pageable);

        List<CourtResponse> data = courtPage.getContent()
                .stream()
                .map(this::mapToResponse)
                .toList();

        return PageResponse.<CourtResponse>builder()
                .currentPage(courtPage.getNumber())
                .totalPages(courtPage.getTotalPages())
                .pageSize(courtPage.getSize())
                .totalElements(courtPage.getTotalElements())
                .data(data)
                .build();
    }

    @Override
    public void deleteCourt(UUID courtId) {
        Court court = courtRepository.findById(courtId)
                .orElseThrow(() -> new AppException(ErrorCode.COURT_NOT_FOUND));
        courtRepository.delete(court);
    }

}
