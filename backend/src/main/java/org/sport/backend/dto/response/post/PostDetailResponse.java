package org.sport.backend.dto.response.post;

import lombok.*;
import org.sport.backend.constant.PostStatus;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostDetailResponse {

    private UUID postId;

    private String title;

    private String description;

    private PostStatus postStatus;

    private UUID courtId;

    private UUID rentalAreaId;

    private UUID userId;

    private LocalDateTime createdAt;

}
