package com.eauction.security;

import com.eauction.model.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Service
public class TokenService {
    private final SecretKey key;
    private final long expirationMillis = 1000L * 60 * 60 * 2;

    public TokenService(Environment env) {
        String envSecret = env.getProperty("jwt.secret");
        String sysSecret = System.getenv("JWT_SECRET");
        String effectiveSecret = envSecret != null ? envSecret
                : (sysSecret != null ? sysSecret : "local-dev-secret-please-change-32-bytes-minimum-123456");
        byte[] bytes = effectiveSecret.getBytes(StandardCharsets.UTF_8);
        this.key = Keys.hmacShaKeyFor(bytes);
    }

    public String generateToken(User user) {
        Date now = new Date();
        Date exp = new Date(now.getTime() + expirationMillis);
        return Jwts.builder()
                .setSubject(user.getUsername())
                .claim("userId", user.getId())
                .claim("role", user.getRole())
                .setIssuedAt(now)
                .setExpiration(exp)
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public User getUserByToken(String token) {
        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
            User user = new User();
            user.setUsername(claims.getSubject());
            Object id = claims.get("userId");
            if (id != null) {
                try {
                    user.setId(Long.parseLong(id.toString()));
                } catch (NumberFormatException ignored) {
                }
            }
            Object role = claims.get("role");
            user.setRole(role != null ? role.toString() : "BIDDER");
            user.setEnabled(true);
            return user;
        } catch (Exception e) {
            return null;
        }
    }
}
