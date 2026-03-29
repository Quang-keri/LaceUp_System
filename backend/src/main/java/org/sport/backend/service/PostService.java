package org.sport.backend.service;

import org.sport.backend.dto.base.PageResponse;
import org.sport.backend.dto.request.post.CreatePostRequest;
import org.sport.backend.dto.request.post.PostFilterRequest;
import org.sport.backend.dto.request.post.UpdatePostRequest;
import org.sport.backend.dto.response.post.PostDetailResponse;
import org.sport.backend.dto.response.post.PostResponse;
import org.sport.backend.dto.response.post.PostSummaryResponse;

import java.util.List;
import java.util.UUID;

public interface PostService {
    PostResponse createPost(CreatePostRequest request);

    PageResponse<PostSummaryResponse> getAllPosts(PostFilterRequest filterRequest);

    PostDetailResponse getPostDetail(UUID postId);

    List<PostSummaryResponse> getMyPosts(String status);

    PostDetailResponse getMyPostDetail(UUID postId);

    PostResponse updateMyPost(UUID postId, UpdatePostRequest request);

    void deleteMyPost(UUID postId);
}
