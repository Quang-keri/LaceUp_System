package org.sport.backend.serviceImpl;

import org.sport.backend.base.PageResponse;
import org.sport.backend.constant.RentalAreaStatus;
import org.sport.backend.dto.internal.CloudinaryUploadResult;
import org.sport.backend.dto.request.rental.RentalAreaRequest;
import org.sport.backend.dto.request.rental.RentalAreaUpdateRequest;
import org.sport.backend.dto.response.amenity.AmenityResponse;
import org.sport.backend.dto.response.city.CityResponse;
import org.sport.backend.dto.response.court.CourtSummaryResponse;
import org.sport.backend.dto.response.courtCopy.CourtCopyResponse;
import org.sport.backend.dto.response.court_price.CourtPriceResponse;
import org.sport.backend.dto.response.rental.RentalAreaDetailResponse;
import org.sport.backend.dto.response.rental.RentalAreaImageResponse;
import org.sport.backend.dto.response.rental.RentalAreaResponse;
import org.sport.backend.dto.response.user.UserResponse;
import org.sport.backend.entity.*;
import org.sport.backend.exception.AppException;
import org.sport.backend.exception.ErrorCode;
import org.sport.backend.repository.*;
import org.sport.backend.service.CloudinaryService;
import org.sport.backend.service.RentalAreaService;
import org.sport.backend.service.UserService;
import org.sport.backend.specification.RentalAreaSpecification;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class RentalAreaServiceImpl implements RentalAreaService {

    @Autowired
    private RentalAreaRepository rentalAreaRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private CityRepository cityRepository;

    @Autowired
    private CloudinaryService cloudinaryService;

    @Autowired
    private CourtRepository courtRepository;

    @Autowired
    private CourtCopyRepository courtCopyRepository;

    @Autowired
    private CourtImageRepository courtImageRepository;

    @Autowired
    private RentalAreaImageRepository rentalAreaImageRepository;

    @Autowired
    private  CourtPriceRepository courtPriceRepository;

    @Override
    public RentalAreaResponse createRentalArea(RentalAreaRequest request, List<MultipartFile> images) {

        int count = images == null ? 0 : (int) images.stream().filter(f -> f != null && !f.isEmpty()).count();
        if (count < 1 || count > 5) {
            throw new IllegalArgumentException("RentalArea yêu cầu  1 tới 5 ảnh");
        }

         User owner = userRepository.findById(request.getUserId()).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        City city = cityRepository.findById(request.getCityId()).orElseThrow(() -> new AppException(ErrorCode.CITY_NOT_FOUND));


        RentalArea rentalArea = RentalArea.builder()
                .rentalAreaName(request.getRentalAreaName())
                .address(request.getAddress())
                .contactName(request.getContactName())
                .contactPhone(request.getContactPhone())
                .status(RentalAreaStatus.ACTIVE)
                .owner(owner)
                .city(city)
                .build();

        rentalAreaRepository.save(rentalArea);
        String folder = "rentals/" + rentalArea.getRentalAreaId();

        List<CloudinaryUploadResult> uploaded = cloudinaryService.uploadImages(images, folder);

        List<RentalAreaImage> entities = new ArrayList<>();
        for (int i = 0; i < uploaded.size(); i++) {
            CloudinaryUploadResult u = uploaded.get(i);

            RentalAreaImage img = RentalAreaImage.builder()
                    .rentalArea(rentalArea)
                    .imageUrl(u.getUrl())
                    .publicId(u.getPublicId())
                    .isCover(i == 0)
                    .sortOrder(i)
                    .build();

            entities.add(img);
        }

        rentalAreaImageRepository.saveAll(entities);

        List<RentalAreaImageResponse> imageResponses = entities.stream()
                .sorted(Comparator.comparing(RentalAreaImage::getSortOrder, Comparator.nullsLast(Integer::compareTo)))
                .map(img -> RentalAreaImageResponse.builder()
                        .rentalAreaImageId(img.getRentalAreaImageId())
                        .imageUrl(img.getImageUrl())
                        .isCover(img.getIsCover())
                        .sortOrder(img.getSortOrder())
                        .build())
                .collect(Collectors.toList());


        return RentalAreaResponse.builder()
                .rentalAreaId(rentalArea.getRentalAreaId())
                .rentalAreaName(rentalArea.getRentalAreaName())
                .address(rentalArea.getAddress())
                .contactName(rentalArea.getContactName())
                .contactPhone(rentalArea.getContactPhone())
                .status(rentalArea.getStatus())
                .images(imageResponses)
                .build();
    }

    private RentalAreaResponse mapToResponse(RentalArea rentalArea) {
        List<RentalAreaImage> images = rentalAreaImageRepository.findByRentalArea(rentalArea);

        List<RentalAreaImageResponse> imageResponses = images.stream()
                .sorted(Comparator.comparing(
                        RentalAreaImage::getSortOrder,
                        Comparator.nullsLast(Integer::compareTo)
                ))
                .map(img -> RentalAreaImageResponse.builder()
                        .rentalAreaImageId(img.getRentalAreaImageId())
                        .imageUrl(img.getImageUrl())
                        .isCover(img.getIsCover())
                        .sortOrder(img.getSortOrder())
                        .build())
                .toList();

        CityResponse cityResponse = CityResponse.builder()
                .cityId(rentalArea.getCity().getCityId())
                .cityName(rentalArea.getCity().getCityName())
                .build();
        UserResponse userResponse = UserResponse.builder()
                .userId(rentalArea.getOwner().getUserId())
                .email(rentalArea.getOwner().getEmail())
                .dateOfBirth(rentalArea.getOwner().getDateOfBirth())
                .phone(rentalArea.getOwner().getPhone())
                .role(rentalArea.getOwner().getRole().getRoleName())
                .build();
        return RentalAreaResponse.builder()
                .rentalAreaId(rentalArea.getRentalAreaId())
                .rentalAreaName(rentalArea.getRentalAreaName())
                .address(rentalArea.getAddress())
                .contactName(rentalArea.getContactName())
                .contactPhone(rentalArea.getContactPhone())
                .status(rentalArea.getStatus())
                .images(imageResponses)
                .owner(userResponse)
                .city(cityResponse)
                .build();
    }
    @Override
    public PageResponse<RentalAreaResponse> getAllRentalAreas(
            int page,
            int size,
            String keyword,
            UUID cityId,
            RentalAreaStatus status,
            LocalDateTime fromDate,
            LocalDateTime toDate
    ) {

        Pageable pageable = PageRequest.of(page -1 , size, Sort.by("createdAt").descending());

        Specification<RentalArea> spec = Specification
                .where(RentalAreaSpecification.isNotDeleted())
                .and(RentalAreaSpecification.hasCity(cityId))
                .and(RentalAreaSpecification.hasStatus(status))
                .and(RentalAreaSpecification.hasKeyword(keyword))
                .and(RentalAreaSpecification.fromDate(fromDate))
                .and(RentalAreaSpecification.toDate(toDate));

        Page<RentalArea> rentalPage = rentalAreaRepository.findAll(spec, pageable);

        List<RentalAreaResponse> data = rentalPage.getContent()
                .stream()
                .map(this::mapToResponse)
                .toList();

        return PageResponse.<RentalAreaResponse>builder()
                .currentPage(rentalPage.getNumber())
                .totalPages(rentalPage.getTotalPages())
                .pageSize(rentalPage.getSize())
                .totalElements(rentalPage.getTotalElements())
                .data(data)
                .build();
    }

    @Override
    public PageResponse<RentalAreaResponse> getMyRentalAreas(
            int page,
            int size,
            String keyword,
            RentalAreaStatus status,
            LocalDateTime fromDate,
            LocalDateTime toDate
    ) {

        UUID userId = userService.getMyInfo().getUserId();

        Pageable pageable = PageRequest.of(page -1, size, Sort.by("createdAt").descending());

        Specification<RentalArea> spec = Specification
                .where(RentalAreaSpecification.isNotDeleted())
                .and(RentalAreaSpecification.ownedBy(userId))
                .and(RentalAreaSpecification.hasStatus(status))
                .and(RentalAreaSpecification.hasKeyword(keyword))
                .and(RentalAreaSpecification.fromDate(fromDate))
                .and(RentalAreaSpecification.toDate(toDate));

        Page<RentalArea> rentalPage = rentalAreaRepository.findAll(spec, pageable);

        List<RentalAreaResponse> data = rentalPage.getContent()
                .stream()
                .map(this::mapToResponse)
                .toList();

        return PageResponse.<RentalAreaResponse>builder()
                .currentPage(rentalPage.getNumber())
                .totalPages(rentalPage.getTotalPages())
                .pageSize(rentalPage.getSize())
                .totalElements(rentalPage.getTotalElements())
                .data(data)
                .build();
    }


    @Override
    public RentalAreaResponse updateRentalArea(UUID rentalAreaId, RentalAreaUpdateRequest request) {

        RentalArea rentalArea = rentalAreaRepository.findById(rentalAreaId)
                .orElseThrow(() -> new RuntimeException("Rental area not found"));

        if (request.getRentalAreaName() != null) {
            rentalArea.setRentalAreaName(request.getRentalAreaName());
        }

        if (request.getAddress() != null) {
            rentalArea.setAddress(request.getAddress());
        }

        if (request.getContactName() != null) {
            rentalArea.setContactName(request.getContactName());
        }

        if (request.getContactPhone() != null) {
            rentalArea.setContactPhone(request.getContactPhone());
        }

        if (request.getCityId() != null) {

            City city = cityRepository.findById(request.getCityId())
                    .orElseThrow(() -> new RuntimeException("City not found"));

            rentalArea.setCity(city);
        }

        rentalAreaRepository.save(rentalArea);

        return mapToResponse(rentalArea);
    }

    @Override
    public RentalAreaDetailResponse getRentalAreaById(UUID rentalAreaId) {

        RentalArea rentalArea = rentalAreaRepository.findById(rentalAreaId)
                .orElseThrow(() -> new AppException(ErrorCode.RENTAL_AREA_NOT_FOUND));

        List<RentalAreaImageResponse> images = rentalAreaImageRepository
                .findByRentalArea(rentalArea)
                .stream()
                .sorted(Comparator.comparing(
                        RentalAreaImage::getSortOrder,
                        Comparator.nullsLast(Integer::compareTo)
                ))
                .map(img -> RentalAreaImageResponse.builder()
                        .rentalAreaImageId(img.getRentalAreaImageId())
                        .imageUrl(img.getImageUrl())
                        .isCover(img.getIsCover())
                        .sortOrder(img.getSortOrder())
                        .build())
                .toList();

        List<Court> courts = courtRepository.findByRentalArea(rentalArea);

        List<CourtSummaryResponse> courtResponses = courts.stream().map(court -> {


            List<AmenityResponse> amenityResponses = court.getAmenities().stream().map(
                    amenity -> AmenityResponse.builder()
                            .amenityId(amenity.getAmenityId())
                            .amenityName(amenity.getAmenityName())
                            .iconKey(amenity.getIconKey())
                            .build()
            ).toList();
            int totalCopies = courtCopyRepository
                    .countByCourt(court);

            String cover = courtImageRepository
                    .findByCourt(court)
                    .stream()
                    .filter(img -> Boolean.TRUE.equals(img.getIsCover()))
                    .findFirst()
                    .map(CourtImage::getImageUrl)
                    .orElse(null);

            List<CourtCopyResponse> copies = courtCopyRepository
                    .findByCourt(court)
                    .stream()
                    .map(copy -> CourtCopyResponse.builder()
                            .courtCopyId(copy.getCourtCopyId())
                            .courtCode(copy.getCourtCode())
                            .status(copy.getCourtCopyStatus())
                            .build())
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

            return CourtSummaryResponse.builder()
                    .courtId(court.getCourtId())
                    .courtName(court.getCourtName())
                    .minPrice(minPrice)
                    .maxPrice(maxPrice)
                    .priceRules(priceResponses)
                    .totalCourts(totalCopies)
                    .categoryId(court.getCategory().getCategoryId())
                    .categoryName(court.getCategory().getCategoryName())
                    .coverImage(cover)
                    .courtCopies(copies)
                    .amenities(amenityResponses)
                    .build();

        }).toList();

        CityResponse cityResponse = CityResponse.builder()
                .cityId(rentalArea.getCity().getCityId())
                .cityName(rentalArea.getCity().getCityName())
                .build();

        return RentalAreaDetailResponse.builder()
                .rentalAreaId(rentalArea.getRentalAreaId())
                .rentalAreaName(rentalArea.getRentalAreaName())
                .address(rentalArea.getAddress())
                .contactName(rentalArea.getContactName())
                .contactPhone(rentalArea.getContactPhone())
                .city(cityResponse)
                .images(images)
                .courts(courtResponses)
                .ownerId(rentalArea.getOwner().getUserId())
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
    public void deleteRentalArea(UUID rentalAreaId) {
        RentalArea rentalArea = rentalAreaRepository.findById(rentalAreaId)
                .orElseThrow(() -> new AppException(ErrorCode.RENTAL_AREA_NOT_FOUND));
        

        rentalArea.setDeletedAt(LocalDateTime.now());
        rentalAreaRepository.save(rentalArea);
    }

}
