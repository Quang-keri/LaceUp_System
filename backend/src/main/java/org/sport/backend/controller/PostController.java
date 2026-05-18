package org.sport.backend.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.sport.backend.dto.base.ApiResponse;
import org.sport.backend.dto.base.PageResponse;
import org.sport.backend.dto.request.post.CreatePostRequest;
import org.sport.backend.dto.request.post.PostFilterRequest;
import org.sport.backend.dto.request.post.UpdatePostRequest;
import org.sport.backend.dto.response.post.PostDetailResponse;
import org.sport.backend.dto.response.post.PostResponse;
import org.sport.backend.dto.response.post.PostSummaryResponse;
import org.sport.backend.service.PostService;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/posts")
@Tag(name = "14. Post")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    @PostMapping
    @PreAuthorize("hasAuthority('CREATE_POST')")
    public ApiResponse<PostResponse> createPost(
            @Valid @RequestBody CreatePostRequest request

    ) {
        try {
            PostResponse result = postService.createPost(request);
            return ApiResponse.<PostResponse>builder()
                    .code(200)
                    .message("Create post successfully")
                    .result(result)
                    .build();
        } catch (Exception e) {
            return ApiResponse.error(500, e.getMessage());
        }
    }

    @GetMapping
    public ApiResponse<PageResponse<PostSummaryResponse>> getAllPosts(
            @ParameterObject PostFilterRequest filterRequest) {
        try {
            return ApiResponse.success(
                    200,
                    "Get all posts successfully",
                    postService.getAllPosts(filterRequest));
        } catch (Exception e) {
            return ApiResponse.error(500, e.getMessage());
        }
    }

    @GetMapping("/{postId}")
    public ApiResponse<PostDetailResponse> getPostDetail(
            @PathVariable UUID postId
    ) {
        PostDetailResponse result = postService.getPostDetail(postId);

        try {
            return ApiResponse.<PostDetailResponse>builder()
                    .code(200)
                    .message("Get post detail successfully")
                    .result(result)
                    .build();
        } catch (Exception e) {
            return ApiResponse.error(500, e.getMessage());
        }

    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<List<PostSummaryResponse>> getMyPosts(
            @RequestParam(required = false) String status
    ) {
        try {
            return ApiResponse.<List<PostSummaryResponse>>builder()
                    .code(200)
                    .message("Get my posts successfully")
                    .result(postService.getMyPosts(status))
                    .build();
        } catch (Exception e) {
            return ApiResponse.error(500, e.getMessage());
        }
    }

    @GetMapping("/me/{postId}")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<PostDetailResponse> getMyPostDetail(
            @PathVariable UUID postId
    ) {
        try {
            return ApiResponse.<PostDetailResponse>builder()
                    .code(200)
                    .message("Get my post detail successfully")
                    .result(postService.getMyPostDetail(postId))
                    .build();
        } catch (Exception e) {
            return ApiResponse.error(500, e.getMessage());
        }
    }

    @PutMapping("/{postId}")
    @PreAuthorize("hasAuthority('UPDATE_POST')")
    public ApiResponse<PostResponse> updateMyPost(
            @PathVariable UUID postId,
            @Valid @RequestBody UpdatePostRequest request
    ) {
        try {
            return ApiResponse.<PostResponse>builder()
                    .code(200)
                    .message("Update post successfully")
                    .result(postService.updateMyPost(postId, request))
                    .build();
        } catch (Exception e) {
            return ApiResponse.error(500, e.getMessage());
        }
    }

    @DeleteMapping("/{postId}")
    @PreAuthorize("hasAuthority('DELETE_POST')")
    public ApiResponse<Void> deleteMyPost(
            @PathVariable UUID postId
    ) {
        try {
            postService.deleteMyPost(postId);
            return ApiResponse.<Void>builder()
                    .code(200)
                    .message("Delete post successfully")
                    .build();
        } catch (Exception e) {
            return ApiResponse.error(500, e.getMessage());
        }
    }

}
