package org.sport.backend.dto.response.city;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CityResponse {
    private Long cityId;
    private String cityName;
}
