package org.sport.backend.dto.response.news;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
public class NewsResponse {
    private UUID id;
    private String title;
    private String content;
    private String imageUrl;
    private String sourceUrl;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}