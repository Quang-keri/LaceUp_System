package org.sport.backend.serviceImpl;

import org.sport.backend.base.PageResponse;
import org.sport.backend.constant.PostStatus;
import org.sport.backend.dto.request.post.CreatePostRequest;
import org.sport.backend.dto.request.post.UpdatePostRequest;
import org.sport.backend.dto.response.post.PostDetailResponse;
import org.sport.backend.dto.response.post.PostResponse;
import org.sport.backend.dto.response.post.PostSummaryResponse;
import org.sport.backend.entity.Court;
import org.sport.backend.entity.Post;
import org.sport.backend.entity.RentalArea;
import org.sport.backend.entity.User;
import org.sport.backend.exception.AppException;
import org.sport.backend.exception.ErrorCode;
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

import java.time.LocalDate;
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

    @Override
    public PostResponse createPost(CreatePostRequest request) {

        UUID userId = userService.getMyInfo().getUserId();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        Court court = courtRepository.findById(request.getCourtId())
                .orElseThrow(() -> new AppException(ErrorCode.COURT_NOT_FOUND));

        RentalArea rentalArea = rentalAreaRepository.findById(request.getRentalAreaId())
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
    public PageResponse<PostSummaryResponse> getAllPosts(
            String title,
            String content,
            LocalDate fromDate,
            LocalDate toDate,
            int page,
            int size
    ) {

        Pageable pageable = PageRequest.of(
                page -1 ,
                size,
                Sort.by("createdAt").descending()
        );

        Specification<Post> spec = Specification
                .where(PostSpecification.hasTitle(title))
                .and(PostSpecification.hasContent(content))
                .and(PostSpecification.fromDate(fromDate))
                .and(PostSpecification.toDate(toDate));

        Page<Post> postPage = postRepository.findAll(spec, pageable);
        System.err.println( "data"+ postPage.getContent());
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
    private PostSummaryResponse mapToSummary(Post post) {

        Court court = post.getCourt();
        RentalArea rentalArea = post.getRentalArea();

        String coverImage = null;

        if (court.getImages() != null && !court.getImages().isEmpty()) {
            coverImage = court.getImages().stream()
                    .filter(img -> Boolean.TRUE.equals(img.getIsCover()))
                    .findFirst()
                    .map(img -> img.getImageUrl())
                    .orElse(null);
        }

        return PostSummaryResponse.builder()
                .postId(post.getPostId())
                .title(post.getTitle())
                .description(post.getDescription())
                .postStatus(post.getPostStatus())
                .createdAt(post.getCreatedAt())

                .courtId(court.getCourtId())
                .courtName(court.getCourtName())
                .price(court.getPrice())
                .courtCoverImageUrl(coverImage)

                .rentalAreaId(rentalArea.getRentalAreaId())
                .rentalAreaName(rentalArea.getRentalAreaName())
                .address(rentalArea.getAddress())

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

}
