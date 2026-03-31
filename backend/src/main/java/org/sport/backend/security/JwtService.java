package org.sport.backend.security;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.sport.backend.properties.JwtProperties;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class JwtService {

    JwtEncoder jwtEncoder;
    JwtDecoder jwtDecoder;
    JwtProperties jwtProperties;

    public String generateAccessToken(UserDetails user) {
        return generateToken(user, jwtProperties.getAccessExpiration(), "access");
    }

    public String generateRefreshToken(UserDetails user) {
        return generateToken(user, jwtProperties.getRefreshExpiration(), "refresh");
    }

    private String generateToken(UserDetails user, long expirationSeconds, String type) {
        Instant now = Instant.now();
        JwtClaimsSet.Builder claimsBuilder = JwtClaimsSet.builder()
                .issuedAt(now)
                .expiresAt(now.plusSeconds(expirationSeconds))
                .subject(user.getUsername())
                .claim("email", user.getUsername())
                .claim("type", type);

        // Chỉ thêm Roles và thông tin chi tiết nếu là Access Token
        if ("access".equals(type)) {
            if (user instanceof CustomUserDetails customUserDetails) {
                claimsBuilder.claim("userId", customUserDetails.getUserId().toString());
            }
            claimsBuilder.claim("roles", user.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority).toList());
        }

        return jwtEncoder.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claimsBuilder.build()))
                .getTokenValue();
    }

    public Authentication getAuthentication(String token) {
        Jwt jwt = jwtDecoder.decode(token);

        String email = jwt.getSubject();

        // 1. Đọc trực tiếp danh sách roles/permissions từ trong Token
        List<String> roles = jwt.getClaimAsStringList("roles");

        // 2. Map thành GrantedAuthority cho Spring Security hiểu
        List<SimpleGrantedAuthority> authorities = roles.stream()
                .map(SimpleGrantedAuthority::new)
                .toList();

        // 3. Trả về Authentication không cần hit Database
        return new UsernamePasswordAuthenticationToken(
                email,
                null,
                authorities
        );
    }

    public boolean validateToken(String token) {
        try {
            Jwt jwt = jwtDecoder.decode(token);
            // Kiểm tra loại token phải là "access"
            return "access".equals(jwt.getClaim("type")) &&
                    Objects.requireNonNull(jwt.getExpiresAt()).isAfter(Instant.now());
        } catch (Exception e) {
            return false;
        }
    }
}
