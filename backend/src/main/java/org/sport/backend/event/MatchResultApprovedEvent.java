package org.sport.backend.event;

import lombok.Getter;
import org.sport.backend.entity.MatchResult;

@Getter
public class MatchResultApprovedEvent {
    private final MatchResult matchResult;

    public MatchResultApprovedEvent(MatchResult matchResult) {
        this.matchResult = matchResult;
    }
}