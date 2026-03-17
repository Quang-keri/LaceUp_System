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
                @Tag(name = "1. Authentication", description = "API quản lý xác thực & phân quyền"),
                @Tag(name = "2. User", description = "API quản lý người dùng"),
                @Tag(name = "3. Role", description = "API quản lý vai trò"),
                @Tag(name = "4. Permission", description = "API quản lý quyền hạn"),
                @Tag(name = "5. Court", description = "API quản lý sân bãi"),
                @Tag(name = "6. Court Copy", description = "API bản sao sân bãi"),
                @Tag(name = "7. Category", description = "API quản lý danh mục"),
                @Tag(name = "8. Amenity", description = "API quản lý tiện ích kèm theo"),
                @Tag(name = "9. Rental Area", description = "API quản lý khu vực cho thuê"),
                @Tag(name = "10. Booking", description = "API quản lý đặt sân"),
                @Tag(name = "11. Payment", description = "API quản lý thanh toán"),
                @Tag(name = "12. Slot", description = "API quản lý khung giờ (Slot)"),
                @Tag(name = "13. Match", description = "API quản lý kèo đấu/trận đấu"),
                @Tag(name = "14. Post", description = "API quản lý bài đăng"),
                @Tag(name = "15. Chat", description = "API quản lý tin nhắn"),
                @Tag(name = "16. Notification", description = "API quản lý thông báo"),
                @Tag(name = "17. Report", description = "API báo cáo & thống kê")
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