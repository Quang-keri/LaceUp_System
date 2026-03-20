package org.sport.backend.dto.request.match;

import lombok.Data;
import org.sport.backend.constant.RecurringType;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class MatchRequest {
    private UUID courtId;
    private Integer categoryId;
    private String address;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer maxPlayers;
    private Integer minPlayersToStart;
    private boolean isRecurring;
    private RecurringType recurringType;
    private String dayOfWeek;
    private LocalDate endDate;
}
