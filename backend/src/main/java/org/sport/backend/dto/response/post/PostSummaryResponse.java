package org.sport.backend.dto.response.post;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.sport.backend.constant.PostStatus;
import org.sport.backend.dto.response.address.AddressResponse;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostSummaryResponse {

    private UUID postId;
    private String title;
    private String description;
    private PostStatus postStatus; // Đảm bảo bạn đã import enum PostStatus
    private LocalDateTime createdAt;

    private UUID courtId;
    private String courtName;
    private BigDecimal minPrice;
    private String courtCoverImageUrl;

    private UUID rentalAreaId;
    private String rentalAreaName;
    private AddressResponse address;
}