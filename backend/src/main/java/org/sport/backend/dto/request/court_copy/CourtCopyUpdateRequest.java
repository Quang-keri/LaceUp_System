package org.sport.backend.dto.request.court_copy;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.sport.backend.constant.CourtCopyStatus;

import java.util.UUID;


@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourtCopyUpdateRequest {
    @NotNull(message = "mã sân chính không bỏ trống")
    private UUID courtId;
    @NotNull(message = "số sân không bỏ trống")
    private String courtCode;
    @NotNull(message = "trạng thái phòng không bỏ trống ")
    private CourtCopyStatus status;
}
