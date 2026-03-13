package org.sport.backend.dto.response.amenity;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AmenityResponse {
    Long amenityId;
    String amenityName;
    String iconKey;
}
