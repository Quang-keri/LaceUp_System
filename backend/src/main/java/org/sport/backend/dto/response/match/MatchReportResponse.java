package org.sport.backend.dto.response.match;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.sport.backend.constant.MatchReportStatus;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MatchReportResponse {

    private UUID reportId;
    private String reporterName;
    private List<UUID> reportedUserIds;
    private String reasonType;
    private String description;
    private MatchReportStatus status;
}
