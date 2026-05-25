package org.sport.backend.dto.request.match;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.sport.backend.constant.RecurringType;
import org.sport.backend.constant.MatchType;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class MatchRequest {
    private UUID courtId;
    private Integer categoryId;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer maxPlayers;
    private Integer minPlayersToStart;
    private boolean isRecurring;
    private RecurringType recurringType;
    private String dayOfWeek;
    private LocalDate endDate;

    private MatchType matchType;
    private Integer minRank;
    private Integer maxRank;
    private String note;
}