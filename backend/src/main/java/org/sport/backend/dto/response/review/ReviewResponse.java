package org.sport.backend.dto.response.review;

import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ReviewResponse {
    private UUID reviewId;
    private Integer rating;
    private String comment;
    private LocalDateTime createdAt;
    private String userName;
    private String userAvatar;
    private UUID rentalAreaId;
    private String rentalName;
    private String address;

}
