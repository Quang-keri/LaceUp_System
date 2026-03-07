package org.sport.backend.security;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.rent.room.be.properties.JwtProperties;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class JwtService {

    JwtEncoder jwtEncoder;
    JwtDecoder jwtDecoder;
    JwtProperties jwtProperties;
    UserDetailsService userDetailsService;

    public String generateAccessToken(UserDetails user) {
        return generateToken(user, jwtProperties.getAccessExpiration(), "access");
    }

    public String generateRefreshToken(UserDetails user) {
        return generateToken(user, jwtProperties.getRefreshExpiration(), "refresh");
    }

    private String generateToken(
            UserDetails user,
            long expirationSeconds,
            String type
    ) {
        Instant now = Instant.now();

        JwsHeader jwsHeader = JwsHeader.with(MacAlgorithm.HS256).build();

        String userId = "";
        if (user instanceof CustomUserDetails customUserDetails) {
            userId = customUserDetails.getUserId().toString();
        }

        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuedAt(now)
                .expiresAt(now.plusSeconds(expirationSeconds))
                .subject(user.getUsername())
                .claim("userId", userId)
                .claim("type", type)
                .claim("email", user.getUsername())
                .claim("roles", user.getAuthorities()
                        .stream()
                        .map(GrantedAuthority::getAuthority)
                        .toList())
                .build();

        return jwtEncoder.encode(
                JwtEncoderParameters.from(jwsHeader, claims)
        ).getTokenValue();
    }

    // Thêm vào JwtService.java

    public Authentication getAuthentication(String token) {
        Jwt jwt = jwtDecoder.decode(token);

        String userId = jwt.getClaim("userId");

        String email = jwt.getSubject();
        UserDetails userDetails = userDetailsService.loadUserByUsername(email);

        return new UsernamePasswordAuthenticationToken(
                userId,
                null,
                userDetails.getAuthorities()
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
