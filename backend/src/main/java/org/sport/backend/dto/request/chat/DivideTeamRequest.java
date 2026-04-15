package org.sport.backend.dto.request.chat;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class DivideTeamRequest {
    private List<UUID> team1UserIds;
    private List<UUID> team2UserIds;
}