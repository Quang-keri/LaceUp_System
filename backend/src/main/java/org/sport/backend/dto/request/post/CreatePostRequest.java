package org.sport.backend.dto.request.post;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreatePostRequest {

    @NotNull(message = "tiêu đề không bỏ trống")
    private String title;

    @NotNull(message = "mô tả không bỏ trống")
    private String description;

    @NotNull(message = "mã sân không bỏ trống")
    private UUID courtId;

    @NotNull(message = "mã nhà không bỏ trống")
    private UUID rentalAreaId;

}
