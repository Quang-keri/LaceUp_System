package org.sport.backend.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.sport.backend.base.ApiResponse;
import org.sport.backend.base.PageResponse;
import org.sport.backend.dto.request.post.CreatePostRequest;
import org.sport.backend.dto.request.post.PostFilterRequest;
import org.sport.backend.dto.request.post.UpdatePostRequest;
import org.sport.backend.dto.response.post.PostDetailResponse;
import org.sport.backend.dto.response.post.PostResponse;
import org.sport.backend.dto.response.post.PostSummaryResponse;

import org.sport.backend.security.CustomUserDetails;
import org.sport.backend.service.PostService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/posts")
@Tag(name = "14. Post")
public class PostController {

    @Autowired
    private PostService postService;

    @PostMapping
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
    public ApiResponse<?> getAllPosts(@ModelAttribute PostFilterRequest filterRequest) {
        try {
            PageResponse<PostSummaryResponse> result = postService.getAllPosts(filterRequest);
            return ApiResponse.success(200, "Get all posts successfully", result);
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
    public ApiResponse<List<PostSummaryResponse>> getMyPosts(
            @RequestParam(required = false) String status,
            @AuthenticationPrincipal UserDetails principal
    ) {

        try {
            UUID currentUserId = null;
            if (principal instanceof CustomUserDetails customUserDetails) {
                currentUserId = customUserDetails.getUserId();
            }
            if (currentUserId == null) {
                throw new RuntimeException("User not authenticated");
            }

            List<PostSummaryResponse> result = postService.getMyPosts(currentUserId, status);


            return ApiResponse.<List<PostSummaryResponse>>builder()
                    .code(200)
                    .message("Get my posts successfully")
                    .result(result)
                    .build();
        } catch (Exception e) {
            return ApiResponse.error(500, e.getMessage());
        }

    }

    @GetMapping("/me/{postId}")
    public ApiResponse<PostDetailResponse> getMyPostDetail(
            @PathVariable UUID postId,
            @AuthenticationPrincipal UserDetails principal
    ) {
        try {
            UUID currentUserId = null;
            if (principal instanceof CustomUserDetails customUserDetails) {
                currentUserId = customUserDetails.getUserId();
            }
            if (currentUserId == null) {
                throw new RuntimeException("User not authenticated");
            }

            PostDetailResponse result = postService.getMyPostDetail(postId, currentUserId);

            return ApiResponse.<PostDetailResponse>builder()
                    .code(200)
                    .message("Get my post detail successfully")
                    .result(result)
                    .build();
        } catch (Exception e) {
            return ApiResponse.error(500, e.getMessage());
        }

    }

    @PutMapping("/{postId}")
    public ApiResponse<PostResponse> updateMyPost(
            @PathVariable UUID postId,
            @Valid @RequestBody UpdatePostRequest request,
            @AuthenticationPrincipal UserDetails principal
    ) {
        try {
            UUID currentUserId = null;
            if (principal instanceof CustomUserDetails customUserDetails) {
                currentUserId = customUserDetails.getUserId();
            }
            if (currentUserId == null) {
                throw new RuntimeException("User not authenticated");
            }

            PostResponse result = postService.updateMyPost(postId, request, currentUserId);

            return ApiResponse.<PostResponse>builder()
                    .code(200)
                    .message("Update post successfully")
                    .result(result)
                    .build();
        } catch (Exception e) {
            return ApiResponse.error(500, e.getMessage());
        }
    }

    @DeleteMapping("/{postId}")
    public ApiResponse<Void> deleteMyPost(
            @PathVariable UUID postId,
            @AuthenticationPrincipal UserDetails principal
    ) {
        try {
            UUID currentUserId = null;
            if (principal instanceof CustomUserDetails customUserDetails) {
                currentUserId = customUserDetails.getUserId();
            }

            if (currentUserId == null) {
                throw new RuntimeException("User not authenticated");
            }

            postService.deleteMyPost(postId, currentUserId);

            return ApiResponse.<Void>builder()
                    .code(200)
                    .message("Delete post successfully")
                    .build();
        } catch (Exception e) {
            return ApiResponse.error(500, e.getMessage());
        }
    }

}
