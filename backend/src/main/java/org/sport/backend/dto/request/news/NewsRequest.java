package org.sport.backend.dto.request.news;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;
import org.sport.backend.constant.NewsVisibility;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
public class NewsRequest {
    private String title;
    private String content;
    private String sourceUrl;
    private NewsVisibility visibility;
    private List<MultipartFile> images;
    private List<UUID> retainedImageIds;
}


