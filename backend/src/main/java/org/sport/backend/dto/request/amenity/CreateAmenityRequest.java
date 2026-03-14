package org.sport.backend.dto.request.amenity;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CreateAmenityRequest {

    @NotNull(message = "tên tiện tích không bỏ trống")
    @Size(max = 100)
    String amenityName;

    @NotNull(message = "icon không bỏ trống")
    @Size(max = 50)
    String iconKey;
}
