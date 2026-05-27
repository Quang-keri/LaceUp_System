package org.sport.backend.config;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.sport.backend.properties.JwtProperties;
import org.sport.backend.properties.UrlProperties;
import org.sport.backend.security.JwtAuthenticationEntryPoint;
import org.sport.backend.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class SecurityConfig {

    static final String[] PUBLIC_ENDPOINT = {
            "/v3/api-docs/**",
            "/swagger-ui/**",
            "/swagger-ui.html",

            "/api/v1/lace-up/v3/api-docs/**",
            "/api/v1/lace-up/swagger-ui/**",
            "/api/v1/lace-up/swagger-ui.html",

            "/auth/**",
            "/api/v1/lace-up/auth/**",

            "/ws/**",
            "/api/v1/lace-up/ws/**",

            "/matches/open",
    };
    UrlProperties urlProperties;

    JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;

    @Bean
    public SecurityFilterChain appSecurityFilterChain(
            HttpSecurity http,
            JwtAuthenticationFilter jwtAuthenticationFilter
    ) throws Exception {

        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .exceptionHandling(ex -> ex.authenticationEntryPoint(jwtAuthenticationEntryPoint))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        .requestMatchers(PUBLIC_ENDPOINT).permitAll()

                        .requestMatchers(HttpMethod.GET, "/posts/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/rental-areas/my-rentals").authenticated()
                        .requestMatchers(HttpMethod.GET, "/rental-areas/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/courts/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/bookings/intent").permitAll()
                        .requestMatchers(HttpMethod.POST, "/bookings/check-availability").permitAll()
                        .requestMatchers(HttpMethod.GET, "/bookings/intent/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/payments/checkout").permitAll()
                        .requestMatchers(HttpMethod.GET, "/amenities/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/categories/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/cities/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/news/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/reviews/rental/{rentalId}").permitAll()

                        .requestMatchers(HttpMethod.GET, "/api/v1/lace-up/posts/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/lace-up/rental-areas/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/lace-up/bookings/intent").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/lace-up/bookings/check-availability").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/lace-up/bookings/intent/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/lace-up/payments/checkout").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/lace-up/amenities/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/lace-up/categories/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/lace-up/news/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/lace-up/reviews/rental/{rentalId}").permitAll()
                        .requestMatchers("/chat/**").authenticated()
                        .requestMatchers("/api/v1/lace-up/chat/**").authenticated()
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public JwtDecoder jwtDecoder(JwtProperties jwtProperties) {
        byte[] keyBytes = jwtProperties.getSecretKey().getBytes(StandardCharsets.UTF_8);

        SecretKeySpec secretKey = new SecretKeySpec(
                keyBytes,
                "HmacSHA256"
        );

        return NimbusJwtDecoder
                .withSecretKey(secretKey)
                .build();
    }

    @Bean
    public JwtEncoder jwtEncoder(JwtProperties jwtProperties) {
        byte[] keyBytes = jwtProperties.getSecretKey().getBytes(StandardCharsets.UTF_8);

        return new NimbusJwtEncoder(
                new ImmutableSecret<>(keyBytes)
        );
    }

//    @Bean
//    public CorsConfigurationSource corsConfigurationSource() {
//        CorsConfiguration config = new CorsConfiguration();
//
//        config.setAllowedOriginPatterns(List.of(
//                "http://localhost",
//                "http://localhost:*",
//                "http://3.27.209.213",
//                "http://3.27.209.213:*",
//                "http://laceupzone.myvnc.com",
//                "http://laceupzone.myvnc.com:*",
//                "https://laceupzone.myvnc.com",
//                "https://laceupzone.myvnc.com:*"
//        ));
//
//        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
//        config.setAllowedHeaders(List.of("*"));
//        config.setExposedHeaders(List.of("Authorization"));
//        config.setAllowCredentials(true);
//
//        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
//        source.registerCorsConfiguration("/**", config);
//
//        return source;
//    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration config = new CorsConfiguration();

        config.setAllowedOriginPatterns(List.of("*"));
        config.setAllowedMethods(List.of("*"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/**", config);

        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}