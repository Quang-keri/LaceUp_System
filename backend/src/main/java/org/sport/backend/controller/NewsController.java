package org.sport.backend.controller;

import org.sport.backend.base.ApiResponse;
import org.sport.backend.base.PageResponse;
import org.sport.backend.dto.request.news.NewsRequest;
import org.sport.backend.dto.response.news.NewsResponse;
import org.sport.backend.security.CustomUserDetails;
import org.sport.backend.service.NewsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;


@RestController
@RequestMapping("/news")

public class NewsController {

    @Autowired
    private NewsService newsService;

    @PostMapping
    public ApiResponse<NewsResponse> create(
            @RequestBody NewsRequest request,
            @AuthenticationPrincipal UserDetails principal
    ) {
        UUID currentUserId = null;

        if (principal instanceof CustomUserDetails customUserDetails) {
            currentUserId = customUserDetails.getUserId();
        }

        if (currentUserId == null) {
            throw new RuntimeException("User not authenticated");
        }
        return ApiResponse.success(201,"Create news successfully",
                newsService.create(request,currentUserId)
        );
    }

    @GetMapping
    public ApiResponse<PageResponse<NewsResponse>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword
    ) {
        return ApiResponse.success( 200,"Get all news successfully",
                newsService.getAll(page, size, keyword)
        );
    }

    @GetMapping("/{id}")
    public ApiResponse<NewsResponse> getById(@PathVariable UUID id) {
        return ApiResponse.success(200,"Get news by id successfully",newsService.getById(id));
    }

    @PutMapping("/{id}")
    public ApiResponse<NewsResponse> update(
            @PathVariable UUID id,
            @RequestBody NewsRequest request
    ) {
        return ApiResponse.success(200,"Update news by id successfully",newsService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable UUID id) {
        newsService.delete(id);
        return ApiResponse.success(200,"Delete successfully",null);
    }

    @GetMapping("/me")
    public ApiResponse<PageResponse<NewsResponse>> getMyNews(
            @AuthenticationPrincipal UserDetails principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {

        UUID currentUserId = null;

        if (principal instanceof CustomUserDetails customUserDetails) {
            currentUserId = customUserDetails.getUserId();
        }

        if (currentUserId == null) {
            throw new RuntimeException("User not authenticated");
        }
        return ApiResponse.success( 200,"Get my news successfully",
                newsService.getMyNews(currentUserId, page, size)
        );
    }

    @GetMapping("/me/count")
    public ApiResponse<Long> countMyNews(
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        return ApiResponse.success(200,"Count my news successfully",
                newsService.countMyNews(user.getUserId())
        );
    }

    @GetMapping("/count")
    public ApiResponse<Long> countAll() {
        return ApiResponse.success(200,"Count al news successfully",newsService.countAll());
    }
}