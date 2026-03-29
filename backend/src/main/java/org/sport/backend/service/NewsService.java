package org.sport.backend.service;

import org.sport.backend.dto.base.PageResponse;
import org.sport.backend.dto.request.news.NewsRequest;
import org.sport.backend.dto.response.news.NewsResponse;

import java.util.UUID;

public interface NewsService {
    NewsResponse create(NewsRequest request);
    NewsResponse update(UUID id, NewsRequest request);
    void delete(UUID id);
    NewsResponse getById(UUID id);
    PageResponse<NewsResponse> getAll(int page, int size, String keyword);
    PageResponse<NewsResponse> getMyNews(int page, int size);
    long countMyNews();
    long countAll();
}