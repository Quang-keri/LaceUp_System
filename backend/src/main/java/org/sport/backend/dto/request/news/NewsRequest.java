package org.sport.backend.dto.request.news;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class NewsRequest {
    private String title;
    private String content;
    private String imageUrl;
    private String sourceUrl;
}
