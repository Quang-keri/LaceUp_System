package org.sport.backend.dto.response.address;

import lombok.*;

@Builder
@Getter
@Setter
public class CityResponse {
    private Long cityId;
    private String cityName;
    private Integer provinceCode;
}
