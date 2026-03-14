package org.sport.backend.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;

import org.springframework.context.annotation.*;
import java.util.List;

import io.swagger.v3.oas.annotations.tags.Tag;
// http://localhost:9999/api/v1/lace-up/swagger-ui/index.html
@OpenAPIDefinition(
        tags = {
                @Tag(name = "1. Authentication", description = "API quản lý xác thực"),
                @Tag(name = "2. User", description = "API quản lý người dùng"),
         }
)
@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        final String securitySchemeName = "bearerAuth";

        return new OpenAPI()
                .info(new Info()
                        .title("Hệ thống Quản lý Cho Thuê Phòng Học")
                        .version("1.0")
                        .description("Tài liệu API cho hệ thống quản lý cho thuê phòng học.")
                        .license(new License().name("API License").url("http://domain.com/license")))
                .servers(List.of(
                        new Server().url("/api/v1/lace-up").description("Local Server URL") ))
                .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))
                .components(new Components()
                        .addSecuritySchemes(securitySchemeName,
                                new SecurityScheme()
                                        .name(securitySchemeName)
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")))

                ;
    }
}