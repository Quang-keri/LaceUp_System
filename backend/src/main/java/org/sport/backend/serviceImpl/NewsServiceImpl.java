package org.sport.backend.serviceImpl;

import lombok.RequiredArgsConstructor;
import org.sport.backend.dto.base.PageResponse;
import org.sport.backend.dto.internal.CloudinaryUploadResult;
import org.sport.backend.dto.request.news.NewsRequest;
import org.sport.backend.dto.response.news.NewsResponse;
import org.sport.backend.entity.News;
import org.sport.backend.entity.NewsImage;
import org.sport.backend.entity.User;
import org.sport.backend.repository.NewsImageRepository;
import org.sport.backend.repository.NewsRepository;
import org.sport.backend.service.CloudinaryService;
import org.sport.backend.service.NewsService;
import org.sport.backend.service.UserService;
import org.sport.backend.specification.NewsSpecification;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service

public class NewsServiceImpl implements NewsService {
    @Autowired
    private  NewsRepository newsRepository;
    @Autowired
    private  UserService userService;
    @Autowired
    private CloudinaryService cloudinaryService;
    @Autowired
    private NewsImageRepository newsImageRepository;
    @Override
    @Transactional
    public NewsResponse create(NewsRequest request) {

        List<MultipartFile> images = request.getImages();

        int count = images == null ? 0 :
                (int) images.stream().filter(f -> f != null && !f.isEmpty()).count();

        if (count > 3) {
            throw new IllegalArgumentException("Tin tức chỉ cho phép tối đa 3 ảnh");
        }

        User user = userService.getCurrentUserEntity();

        News news = News.builder()
            .title(request.getTitle())
            .content(request.getContent())
            .sourceUrl(request.getSourceUrl())
            .createdBy(user)
                .createdAt(LocalDateTime.now())
            .visibility(request.getVisibility() == null ? org.sport.backend.constant.NewsVisibility.PUBLIC : request.getVisibility())
            .build();

        news = newsRepository.save(news);

        // Xử lý upload ảnh
        if (count > 0) {
            String folder = "news/" + news.getNewsId();
            List<CloudinaryUploadResult> uploaded = cloudinaryService.uploadImages(images, folder);

            List<NewsImage> entities = new ArrayList<>();
            for (int i = 0; i < uploaded.size(); i++) {
                CloudinaryUploadResult u = uploaded.get(i);
                NewsImage img = NewsImage.builder()
                        .news(news)
                        .imageUrl(u.getUrl())
                        .publicId(u.getPublicId())
                        .isCover(i == 0)
                        .build();
                entities.add(img);
            }
            newsImageRepository.saveAll(entities);
            news.setImages(entities);
        }

        return mapToResponse(news);
    }

    @Override
    @Transactional
    public NewsResponse update(UUID id, NewsRequest request) {
        News news = newsRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("News not found"));

        news.setTitle(request.getTitle().trim());
        news.setContent(request.getContent());
        news.setSourceUrl(request.getSourceUrl());
        news.setVisibility(request.getVisibility());


        List<UUID> retainedImageIds = request.getRetainedImageIds() != null
                ? request.getRetainedImageIds() : new ArrayList<>();


        List<NewsImage> managedImages = news.getImages();

        List<NewsImage> imagesToDelete = new ArrayList<>();
        List<NewsImage> currentImages = new ArrayList<>();


        for (NewsImage img : managedImages) {
            if (retainedImageIds.contains(img.getImageId())) {
                currentImages.add(img);
            } else {
                imagesToDelete.add(img);
                if (img.getPublicId() != null) {
                    cloudinaryService.deleteByPublicId(img.getPublicId());
                }
            }
        }


        newsImageRepository.deleteAll(imagesToDelete);

        List<MultipartFile> newFiles = request.getImages();
        if (newFiles != null && !newFiles.isEmpty()) {
            int newFilesCount = (int) newFiles.stream().filter(f -> f != null && !f.isEmpty()).count();

            if (currentImages.size() + newFilesCount > 3) {
                throw new IllegalArgumentException("Tin tức chỉ cho phép tối đa 3 ảnh");
            }

            String folder = "news/" + news.getNewsId();
            List<CloudinaryUploadResult> uploaded = cloudinaryService.uploadImages(newFiles, folder);

            List<NewsImage> newImageEntities = new ArrayList<>();
            for (int i = 0; i < uploaded.size(); i++) {
                CloudinaryUploadResult u = uploaded.get(i);
                NewsImage img = NewsImage.builder()
                        .news(news)
                        .imageUrl(u.getUrl())
                        .publicId(u.getPublicId())
                        .isCover(currentImages.isEmpty() && i == 0)
                        .build();
                newImageEntities.add(img);
            }
            newsImageRepository.saveAll(newImageEntities);
            currentImages.addAll(newImageEntities);
        }

        managedImages.clear();
        managedImages.addAll(currentImages);


        newsRepository.save(news);

        return mapToResponse(news);
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        News news = newsRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("News not found"));


        List<NewsImage> images = newsImageRepository.findByNews(news);
        for (NewsImage img : images) {
            if (img.getPublicId() != null) {
                cloudinaryService.deleteByPublicId(img.getPublicId());
            }
        }

        newsRepository.delete(news);
    }

    @Override
    public NewsResponse getById(UUID id) {
        News news = newsRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("News not found"));

        User currentUser = userService.getCurrentUserEntity();

        if (news.getVisibility() == org.sport.backend.constant.NewsVisibility.PRIVATE) {
            if (currentUser == null || currentUser.getRole() == null || !"ADMIN".equalsIgnoreCase(currentUser.getRole().getRoleName())) {
                throw new RuntimeException("Access denied");
            }
        } else if (news.getVisibility() == org.sport.backend.constant.NewsVisibility.MEMBER) {
            if (currentUser == null) {
                throw new RuntimeException("Access denied");
            }
        }

        return mapToResponse(news);
    }

    @Override
    public PageResponse<NewsResponse> getAll(int page, int size, String keyword) {
        User currentUser = userService.getCurrentUserEntity();
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Specification<News> spec = Specification.where(NewsSpecification.search(keyword))
                .and(NewsSpecification.getNewsByVisibility(currentUser));
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
    public PageResponse<NewsResponse> getMyNews(
            int page, int size) {

        UUID userId = userService.getCurrentUserEntity().getUserId();

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
    public long countMyNews() {
        UUID userId = userService.getCurrentUserEntity().getUserId();
        return newsRepository.countByCreatedBy_UserId(userId);
    }

    @Override
    public long countAll() {
        return newsRepository.count();
    }


    private NewsResponse mapToResponse(News news) {
        List<String> imageUrls = news.getImages() != null
            ? news.getImages().stream().map(NewsImage::getImageUrl).toList()
            : new ArrayList<>();

        List<org.sport.backend.dto.response.news.NewsImageResponse> images = news.getImages() != null
            ? news.getImages().stream().map(img -> org.sport.backend.dto.response.news.NewsImageResponse.builder()
                .id(img.getImageId())
                .imageUrl(img.getImageUrl())
                .isCover(img.getIsCover())
                .build()).toList()
            : new ArrayList<>();

        return NewsResponse.builder()
            .id(news.getNewsId())
            .title(news.getTitle())
            .content(news.getContent())
            .imageUrl(imageUrls.isEmpty() ? null : imageUrls.get(0))
            .images(images)
            .sourceUrl(news.getSourceUrl())
            .createdBy(news.getCreatedBy() != null ? news.getCreatedBy().getUserName() : null)
            .createdAt(news.getCreatedAt())
            .visibility(news.getVisibility() != null ? news.getVisibility().name() : org.sport.backend.constant.NewsVisibility.PUBLIC.name())
            .build();
    }
}
