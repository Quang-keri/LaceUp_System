package org.sport.backend.dto.response.news;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@Builder
public class NewsImageResponse {
    private UUID id;
    private String imageUrl;
    private Boolean isCover;
}
