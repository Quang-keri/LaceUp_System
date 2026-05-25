package org.sport.backend.dto.request.match;

import lombok.Data;
import org.sport.backend.constant.MatchType;

@Data
public class AutoMatchRequest {
    private Integer categoryId;
    private MatchType matchType;
    private String city;
}