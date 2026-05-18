package org.sport.backend.properties;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "url")
@Getter
@Setter
public class UrlProperties {
    private String backend;
    private String frontend;
}
