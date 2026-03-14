package org.sport.backend.dto.response.rental;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RentalAreaImageResponse {
    UUID rentalAreaImageId;
    String imageUrl;
    Boolean isCover;
    Integer sortOrder;
}