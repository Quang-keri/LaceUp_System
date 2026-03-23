package org.sport.backend.serviceImpl;

import lombok.RequiredArgsConstructor;
import org.sport.backend.base.PageResponse;
import org.sport.backend.dto.request.news.NewsRequest;
import org.sport.backend.dto.response.news.NewsResponse;
import org.sport.backend.entity.News;
import org.sport.backend.entity.User;
import org.sport.backend.repository.NewsRepository;
import org.sport.backend.repository.UserRepository;
import org.sport.backend.service.NewsService;
import org.sport.backend.specification.NewsSpecification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NewsServiceImpl implements NewsService {

    private final NewsRepository newsRepository;
    private final UserRepository userRepository;

    @Override
    public NewsResponse create(NewsRequest request, UUID userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        News news = new News();
        news.setTitle(request.getTitle());
        news.setContent(request.getContent());
        news.setImageUrl(request.getImageUrl());
        news.setSourceUrl(request.getSourceUrl());
        news.setCreatedBy(user);

        return mapToResponse(newsRepository.save(news));
    }

    @Override
    public NewsResponse update(UUID id, NewsRequest request) {

        News news = newsRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("News not found"));

        news.setTitle(request.getTitle());
        news.setContent(request.getContent());
        news.setImageUrl(request.getImageUrl());
        news.setSourceUrl(request.getSourceUrl());

        return mapToResponse(newsRepository.save(news));
    }

    @Override
    public void delete(UUID id) {
        newsRepository.deleteById(id);
    }

    @Override
    public NewsResponse getById(UUID id) {
        return newsRepository.findById(id)
                .map(this::mapToResponse)
                .orElseThrow(() -> new RuntimeException("News not found"));
    }

    @Override
    public PageResponse<NewsResponse> getAll(int page, int size, String keyword) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        Specification<News> spec = Specification.where(
                NewsSpecification.search(keyword)
        );

        Page<News> newsPage = newsRepository.findAll(spec, pageable);

        return PageResponse.<NewsResponse>builder()
                .currentPage(page)
                .pageSize(size)
                .totalPages(newsPage.getTotalPages())
                .totalElements(newsPage.getTotalElements())
                .data(newsPage.getContent().stream()
                        .map(this::mapToResponse)
                        .toList())
                .build();
    }

    @Override
    public PageResponse<NewsResponse> getMyNews(UUID userId, int page, int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        Page<News> newsPage = newsRepository.findByCreatedBy_UserId(userId, pageable);

        return PageResponse.<NewsResponse>builder()
                .currentPage(page)
                .pageSize(size)
                .totalPages(newsPage.getTotalPages())
                .totalElements(newsPage.getTotalElements())
                .data(newsPage.getContent().stream()
                        .map(this::mapToResponse)
                        .toList())
                .build();
    }

    @Override
    public long countMyNews(UUID userId) {
        return newsRepository.countByCreatedBy_UserId(userId);
    }

    @Override
    public long countAll() {
        return newsRepository.count();
    }


    private NewsResponse mapToResponse(News news) {
        return NewsResponse.builder()
                .id(news.getNews_id())
                .title(news.getTitle())
                .content(news.getContent())
                .imageUrl(news.getImageUrl())
                .sourceUrl(news.getSourceUrl())
                .createdBy(news.getCreatedBy().getUserName())
                .createdAt(news.getCreatedAt())
                .build();
    }
}
