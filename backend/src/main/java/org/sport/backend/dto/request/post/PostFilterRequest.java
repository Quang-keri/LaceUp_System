package org.sport.backend.dto.request.post;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class PostFilterRequest {
    private String title;
    private BigDecimal minPrice;
    private BigDecimal maxPrice;
    private List<Long> cityIds;
    private List<Integer> provinceCodes;
    private List<Long> categoryIds;
    private List<Long> amenityIds;
    private String sortBy;
    private int page = 1;
    private int size = 10;
    private Double minRating;
}
