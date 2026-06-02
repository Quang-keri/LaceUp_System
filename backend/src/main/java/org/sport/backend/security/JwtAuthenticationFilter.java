package org.sport.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Optional;

@Slf4j
@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    JwtDecoder jwtDecoder;
    JwtService jwtService;

    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        String path = request.getServletPath();
        String method = request.getMethod();

        if ("OPTIONS".equalsIgnoreCase(method)) {
            return true;
        }
        return path.startsWith("/auth")
                || path.startsWith("/posts")
                || path.startsWith("/amenities")
                || path.startsWith("/categories")
                || path.startsWith("/news")
                || path.startsWith("/ws")
                || path.startsWith("/v3/api-docs")
                || path.startsWith("/swagger-ui");
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        if (SecurityContextHolder.getContext().getAuthentication() != null) {
            filterChain.doFilter(request, response);
            return;
        }

        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);

        try {
            Jwt jwt = jwtDecoder.decode(token);
            log.info("JWT_FILTER decoded token type={}", Optional.ofNullable(jwt.getClaim("type")));

            if (!"access".equals(jwt.getClaim("type"))) {
                filterChain.doFilter(request, response);
                return;
            }

            Authentication authentication = jwtService.getAuthentication(token);

            if (authentication.getPrincipal() instanceof CustomUserDetails userDetails) {

                if (!userDetails.isEnabled() || !userDetails.isAccountNonLocked()) {

                    SecurityContextHolder.clearContext();

                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json");

                    response.getWriter().write("""
                                {
                                    "code": "ACCOUNT_DEACTIVATED",
                                    "message": "Account has been deactivated"
                                }
                            """);

                    return;
                }
            }

            if (authentication instanceof UsernamePasswordAuthenticationToken authWithDetails) {
                authWithDetails.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request)
                );
            }

            SecurityContextHolder.getContext().setAuthentication(authentication);

        } catch (JwtException e) {
            log.error("JWT_FILTER invalid token: {}", e.getMessage());
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
        log.info("JWT_FILTER start path={}", request.getServletPath());
    }

}
