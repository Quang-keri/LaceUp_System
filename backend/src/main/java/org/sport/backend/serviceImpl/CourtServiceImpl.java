package org.sport.backend.serviceImpl;

import org.sport.backend.base.PageResponse;
import org.sport.backend.constant.CourtCopyStatus;
import org.sport.backend.constant.CourtStatus;
import org.sport.backend.dto.internal.CloudinaryUploadResult;
import org.sport.backend.dto.request.court.CourtRequest;
import org.sport.backend.dto.request.court.CourtUpdateRequest;
import org.sport.backend.dto.response.court.CourtImageResponse;
import org.sport.backend.dto.response.court.CourtResponse;
import org.sport.backend.dto.response.courtCopy.CourtCopyResponse;
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

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

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

        // tạo court
        Court court = Court.builder()
                .courtName(request.getCourtName())
                .price(request.getPricePerHour())
                .courtStatus(CourtStatus.ACTIVE)
                .rentalArea(rentalArea)
                .build();

        // lưu court trước để có courtId
        courtRepository.save(court);

        // tạo court copies
        List<CourtCopy> courtCopies = new ArrayList<>();

        for (String code : request.getCourtCodes()) {

            CourtCopy courtCopy = CourtCopy.builder()
                    .courtCode(code)
                    .courtCopyStatus(CourtCopyStatus.ACTIVE)
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


        court.setCourtName(request.getCourtName().trim());
        court.setCategory(category);
        court.setPrice(request.getPricePerHour());
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
                page -1,
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
                page -1,
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


        List<CourtCopy> courtCopies =
                courtCopyRepository.findByCourt_CourtId(court.getCourtId());

        List<CourtCopyResponse> copyResponses = courtCopies.stream()
                .map(copy -> CourtCopyResponse.builder()
                        .courtCopyId(copy.getCourtCopyId())
                        .courtCode(copy.getCourtCode())
                        .status(copy.getCourtCopyStatus())
                        .build())
                .toList();

        return CourtResponse.builder()
                .courtId(court.getCourtId())
                .courtName(court.getCourtName())
                .pricePerHour(court.getPrice())
                .status(court.getCourtStatus())
                .rentalAreaId(court.getRentalArea().getRentalAreaId())
                .images(imageResponses)
                .courtCopies(copyResponses)
                .build();
    }
}
