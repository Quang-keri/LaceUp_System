package org.sport.backend.dto.response.city;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class CityResponse {
    private Long cityId;
    private String cityName;
    private Integer provinceCode;
}
