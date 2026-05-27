package org.sport.backend.dto.request.match;

import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class ReportRequest {
    private UUID matchId;
    private List<UUID> reportedUserIds;
    private String reasonType;
    private String description;
    private List<String> evidenceImages;
}