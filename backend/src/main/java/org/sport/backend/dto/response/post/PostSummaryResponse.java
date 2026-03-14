package org.sport.backend.dto.response.post;

import lombok.*;
import org.sport.backend.constant.PostStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostSummaryResponse {
    private UUID postId;
    private String title;
    private String description;
    private PostStatus postStatus;
    private LocalDateTime createdAt;


    private UUID courtId;
    private String courtName;
    private BigDecimal price;
    private String courtCoverImageUrl;


    private UUID rentalAreaId;
    private String rentalAreaName;
    private String address;
}
