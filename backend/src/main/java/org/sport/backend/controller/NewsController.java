package org.sport.backend.controller;

import lombok.RequiredArgsConstructor;
import org.sport.backend.dto.base.ApiResponse;
import org.sport.backend.dto.base.PageResponse;
import org.sport.backend.dto.request.news.NewsRequest;
import org.sport.backend.dto.response.news.NewsResponse;
import org.sport.backend.service.NewsService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/news")
@RequiredArgsConstructor
public class NewsController {

    private final NewsService newsService;

    @PostMapping
    @PreAuthorize("hasAuthority('CREATE_NEWS')")
    public ApiResponse<NewsResponse> create(
            @RequestBody NewsRequest request
    ) {
        return ApiResponse.success(
                201,
                "Create news successfully",
                newsService.create(request)
        );
    }

    @GetMapping
    public ApiResponse<PageResponse<NewsResponse>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword
    ) {
        return ApiResponse.success(
                200,
                "Get all news successfully",
                newsService.getAll(page, size, keyword)
        );
    }

    @GetMapping("/{id}")
    public ApiResponse<NewsResponse> getById(
            @PathVariable UUID id) {
        return ApiResponse.success(
                200,
                "Get news by id successfully",
                newsService.getById(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('UPDATE_NEWS')")
    public ApiResponse<NewsResponse> update(
            @PathVariable UUID id,
            @RequestBody NewsRequest request
    ) {
        return ApiResponse.success(
                200,
                "Update news by id successfully",
                newsService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('DELETE_NEWS')")
    public ApiResponse<Void> delete(@PathVariable UUID id) {
        newsService.delete(id);
        return ApiResponse.success(
                204,
                "Delete successfully",
                null);
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<PageResponse<NewsResponse>> getMyNews(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ApiResponse.success(
                200,
                "Get my news successfully",
                newsService.getMyNews(page, size)
        );
    }

    @GetMapping("/me/count")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Long> countMyNews() {
        return ApiResponse.success(
                200,
                "Count my news successfully",
                newsService.countMyNews()
        );
    }

    @GetMapping("/count")
    public ApiResponse<Long> countAll() {
        return ApiResponse.success(
                200,
                "Count al news successfully",
                newsService.countAll());
    }

}