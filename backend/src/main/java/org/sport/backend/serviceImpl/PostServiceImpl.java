package org.sport.backend.serviceImpl;

import org.sport.backend.base.PageResponse;
import org.sport.backend.constant.PostStatus;
import org.sport.backend.dto.request.post.CreatePostRequest;
import org.sport.backend.dto.request.post.PostFilterRequest;
import org.sport.backend.dto.request.post.UpdatePostRequest;
import org.sport.backend.dto.response.post.PostDetailResponse;
import org.sport.backend.dto.response.post.PostResponse;
import org.sport.backend.dto.response.post.PostSummaryResponse;
import org.sport.backend.entity.*;
import org.sport.backend.exception.AppException;
import org.sport.backend.exception.ErrorCode;
import org.sport.backend.mapper.AddressMapper;
import org.sport.backend.repository.CourtRepository;
import org.sport.backend.repository.PostRepository;
import org.sport.backend.repository.RentalAreaRepository;
import org.sport.backend.repository.UserRepository;
import org.sport.backend.service.PostService;
import org.sport.backend.service.UserService;
import org.sport.backend.specification.PostSpecification;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
public class PostServiceImpl implements PostService {

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CourtRepository courtRepository;

    @Autowired
    private RentalAreaRepository rentalAreaRepository;

    @Autowired
    private AddressMapper addressMapper;

    @Override
    public PostResponse createPost(CreatePostRequest request) {

        UUID userId = userService.getMyInfo().getUserId();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        Court court = courtRepository.findById(request.getCourtId())
                .orElseThrow(() -> new AppException(ErrorCode.COURT_NOT_FOUND));

        RentalArea rentalArea = rentalAreaRepository.findById(court.getRentalArea().getRentalAreaId())
                .orElseThrow(() -> new AppException(ErrorCode.RENTAL_AREA_NOT_FOUND));

        Post post = Post.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .postStatus(PostStatus.PUBLISHED)
                .user(user)
                .court(court)
                .rentalArea(rentalArea)
                .build();

        postRepository.save(post);

        return mapToResponse(post);
    }

    @Override
    public PageResponse<PostSummaryResponse> getAllPosts(PostFilterRequest filterRequest) {


        Sort sort = Sort.by("createdAt").descending();

        if ("price_low".equals(filterRequest.getSortBy())) {

            sort = Sort.by("court.courtPrices.pricePerHour").ascending();
        } else if ("price_high".equals(filterRequest.getSortBy())) {
            sort = Sort.by("court.courtPrices.pricePerHour").descending();
        }

        Pageable pageable = PageRequest.of(filterRequest.getPage() - 1, filterRequest.getSize(), sort);

        Specification<Post> spec = PostSpecification.filterByCriteria(filterRequest);

        // 3. Query
        Page<Post> postPage = postRepository.findAll(spec, pageable);

        // 4. Map to DTO
        List<PostSummaryResponse> data = postPage.getContent()
                .stream()
                .map(this::mapToSummary)
                .toList();

        return PageResponse.<PostSummaryResponse>builder()
                .currentPage(postPage.getNumber())
                .totalPages(postPage.getTotalPages())
                .pageSize(postPage.getSize())
                .totalElements(postPage.getTotalElements())
                .data(data)
                .build();
    }

    @Override
    public PostDetailResponse getPostDetail(UUID postId) {

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new AppException(ErrorCode.POST_NOT_FOUND));

        return mapToDetail(post);
    }

    @Override
    public List<PostSummaryResponse> getMyPosts(UUID userId, String status) {

        List<Post> posts = postRepository.findByUser_UserId(userId);

        return posts.stream()
                .map(this::mapToSummary)
                .toList();
    }
    private PostSummaryResponse mapToSummary(Post post) {
        Court court = post.getCourt();
        RentalArea rentalArea = post.getRentalArea();

        // 1. Tìm giá thấp nhất của sân này để hiển thị lên Card
        // Thêm check null cho courtPrices đề phòng dữ liệu bị thiếu
        BigDecimal minPrice = BigDecimal.ZERO;
        if (court.getCourtPrices() != null && !court.getCourtPrices().isEmpty()) {
            minPrice = court.getCourtPrices().stream()
                    .map(CourtPrice::getPricePerHour)
                    .min(BigDecimal::compareTo)
                    .orElse(BigDecimal.ZERO);
        }

        // 2. Lấy ảnh bìa
        String coverImage = null;
        if (court.getImages() != null && !court.getImages().isEmpty()) {
            coverImage = court.getImages().stream()
                    .filter(img -> Boolean.TRUE.equals(img.getIsCover()))
                    .findFirst()
                    .map(CourtImage::getImageUrl)
                    .orElse(null);
        }

        // 3. Build DTO trả về đầy đủ các trường
        return PostSummaryResponse.builder()
                .postId(post.getPostId())
                .title(post.getTitle())
                .description(post.getDescription())
                .postStatus(post.getPostStatus())
                .createdAt(post.getCreatedAt())

                .courtId(court.getCourtId())
                .courtName(court.getCourtName())
                .minPrice(minPrice) // Gắn giá trị minPrice đã tìm được
                .courtCoverImageUrl(coverImage)

                .rentalAreaId(rentalArea.getRentalAreaId())
                .rentalAreaName(rentalArea.getRentalAreaName())
                .address(addressMapper.toAddressResponse(rentalArea.getAddress()))
                .build();
    }
    @Override
    public PostDetailResponse getMyPostDetail(UUID postId, UUID userId) {

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new AppException(ErrorCode.POST_NOT_FOUND));


        if (!post.getUser().getUserId().equals(userId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        return mapToDetail(post);
    }
    @Override
    public PostResponse updateMyPost(UUID postId,
                                     UpdatePostRequest request,
                                     UUID userId) {

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new AppException(ErrorCode.POST_NOT_FOUND));

        if (!post.getUser().getUserId().equals(userId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        if (request.getTitle() != null)
            post.setTitle(request.getTitle());

        if (request.getDescription() != null)
            post.setDescription(request.getDescription());

        if (request.getPostStatus() != null)
            post.setPostStatus(request.getPostStatus());

        postRepository.save(post);

        return mapToResponse(post);
    }
    private PostResponse mapToResponse(Post post) {

        return PostResponse.builder()
                .postId(post.getPostId())
                .title(post.getTitle())
                .description(post.getDescription())
                .postStatus(post.getPostStatus())
                .courtId(post.getCourt().getCourtId())
                .rentalAreaId(post.getRentalArea().getRentalAreaId())
                .userId(post.getUser().getUserId())
                .createdAt(post.getCreatedAt())
                .build();
    }




    private PostDetailResponse mapToDetail(Post post) {

        return PostDetailResponse.builder()
                .postId(post.getPostId())
                .title(post.getTitle())
                .description(post.getDescription())
                .postStatus(post.getPostStatus())
                .courtId(post.getCourt().getCourtId())
                .rentalAreaId(post.getRentalArea().getRentalAreaId())
                .userId(post.getUser().getUserId())
                .createdAt(post.getCreatedAt())
                .build();
    }

    public void deleteMyPost(UUID postId, UUID userId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        if (!post.getUser().getUserId().equals(userId)) {
            throw new RuntimeException("You don't have permission to delete this post");
        }

        postRepository.delete(post);
    }

}
