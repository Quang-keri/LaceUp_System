package org.sport.backend.dto.request.ward;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class WardRequest {
    private String name;
    private Integer code;
    private Integer province_code;
}
