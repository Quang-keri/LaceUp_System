package org.sport.backend.service;

import org.sport.backend.base.PageResponse;
import org.sport.backend.dto.request.post.CreatePostRequest;
import org.sport.backend.dto.request.post.UpdatePostRequest;
import org.sport.backend.dto.response.post.PostDetailResponse;
import org.sport.backend.dto.response.post.PostResponse;
import org.sport.backend.dto.response.post.PostSummaryResponse;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface PostService {
    PostResponse createPost(CreatePostRequest request);

    PageResponse<PostSummaryResponse> getAllPosts(
            String title,
            String content,
            LocalDate fromDate,
            LocalDate toDate,
            int page,
            int size
    );

    PostDetailResponse getPostDetail(UUID postId);

    List<PostSummaryResponse> getMyPosts(UUID userId, String status);

    PostDetailResponse getMyPostDetail(UUID postId, UUID userId);

    PostResponse updateMyPost(UUID postId, UpdatePostRequest request, UUID userId);
}
