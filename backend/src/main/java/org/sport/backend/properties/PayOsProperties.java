package org.sport.backend.properties;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "payos")
public class PayOsProperties {
    private String clientId;
    private String apiKey;
    private String checksumKey;
    private String baseUrl;
    private String returnUrl;
    private String cancelUrl;
}

