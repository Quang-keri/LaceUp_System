package org.sport.backend.dto.response.post;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.sport.backend.constant.PostStatus;
import org.sport.backend.dto.response.address.AddressResponse;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import org.sport.backend.dto.response.post.AvailableCourtResponse;

@Data
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
    private BigDecimal minPrice;
    private String courtCoverImageUrl;

    private UUID rentalAreaId;
    private String rentalAreaName;
    private AddressResponse address;
    private Double avgRating;
}