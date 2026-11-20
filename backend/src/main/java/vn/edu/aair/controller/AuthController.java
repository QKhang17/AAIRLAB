package vn.edu.aair.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.edu.aair.dto.ApiResponse;
import vn.edu.aair.dto.LoginRequest;
import vn.edu.aair.dto.LoginResponse;
import vn.edu.aair.dto.UserResponse;
import vn.edu.aair.service.AuthService;
import vn.edu.aair.security.JwtRevocationService;
import vn.edu.aair.security.JwtService;

import java.time.Duration;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final boolean secureCookie;
    private final String sameSite;
    private final JwtService jwtService;
    private final JwtRevocationService jwtRevocationService;

    public AuthController(
            AuthService authService,
            @Value("${app.auth.cookie-secure:true}") boolean secureCookie,
            @Value("${app.auth.cookie-same-site:Lax}") String sameSite,
            JwtService jwtService,
            JwtRevocationService jwtRevocationService
    ) {
        this.authService = authService;
        this.secureCookie = secureCookie;
        this.sameSite = sameSite;
        this.jwtService = jwtService;
        this.jwtRevocationService = jwtRevocationService;
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest
    ) {
        String clientIp = httpRequest.getRemoteAddr();
        var login = authService.login(request, clientIp);
        var response = new LoginResponse(null, "Cookie", login.expiresIn(), login.user());
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, accessCookie(login.accessToken(), login.expiresIn()).toString())
                .body(ApiResponse.success("Đăng nhập thành công", response));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(HttpServletRequest request) {
        String token = bearerToken(request.getHeader(HttpHeaders.AUTHORIZATION));
        if (token == null && request.getCookies() != null) {
            for (var cookie : request.getCookies()) {
                if ("AAIR_ACCESS_TOKEN".equals(cookie.getName())) {
                    token = cookie.getValue();
                    break;
                }
            }
        }
        if (token != null) {
            try {
                jwtRevocationService.revoke(jwtService.extractTokenId(token), jwtService.extractExpiration(token));
            } catch (RuntimeException ignored) {
                // Logout remains idempotent even if the presented token is already invalid.
            }
        }
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, accessCookie("", 0).toString())
                .body(ApiResponse.success("Đã đăng xuất", null));
    }

    @GetMapping("/csrf")
    public ResponseEntity<ApiResponse<String>> csrf(CsrfToken token) {
        return ResponseEntity.ok(ApiResponse.success("CSRF token", token.getToken()));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> currentUser(Authentication authentication) {
        return ResponseEntity.ok(
                ApiResponse.success(
                        "Lấy thông tin tài khoản thành công",
                        authService.getCurrentUser(authentication.getName())
                )
        );
    }

    private ResponseCookie accessCookie(String token, long expiresInSeconds) {
        return ResponseCookie.from("AAIR_ACCESS_TOKEN", token)
                .httpOnly(true)
                .secure(secureCookie)
                .sameSite(sameSite)
                .path("/api")
                .maxAge(Duration.ofSeconds(expiresInSeconds))
                .build();
    }

    private String bearerToken(String authorization) {
        if (authorization == null || !authorization.startsWith("Bearer ")) return null;
        String token = authorization.substring(7).trim();
        return token.isBlank() ? null : token;
    }
}
