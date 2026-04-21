package org.sport.backend.dto.request.court_copy;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourtCopyRequest {

    @NotNull(message = "mã sân chính không bỏ trống")
    private UUID courtId;
    @NotNull(message = "số sân không bỏ trống")
    private String courtCode;
    @NotNull(message = "địa điểm không bỏ trống")
    private String location;

}
