package vn.edu.aair.service;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.aair.dto.LoginRequest;
import vn.edu.aair.dto.LoginResponse;
import vn.edu.aair.dto.UserResponse;
import vn.edu.aair.entity.User;
import vn.edu.aair.exception.AuthException;
import vn.edu.aair.repository.UserRepository;
import vn.edu.aair.security.JwtService;

@Service
public class AuthService {

    public record LoginResult(String accessToken, long expiresIn, UserResponse user) {}

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final LoginRateLimiter loginLimiter;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            LoginRateLimiter loginLimiter
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.loginLimiter = loginLimiter;
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        var result = login(request, "unknown");
        return new LoginResponse(result.accessToken(), "Bearer", result.expiresIn(), result.user());
    }

    @Transactional(readOnly = true)
    public LoginResult login(LoginRequest request, String clientIp) {
        String username = request.username().trim();
        if (loginLimiter.isBlocked(clientIp, username)) {
            throw new AuthException("TOO_MANY_ATTEMPTS", HttpStatus.TOO_MANY_REQUESTS,
                    "Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau.");
        }
        User user = userRepository.findByUsernameIgnoreCase(username).orElse(null);

        if (user == null || !passwordEncoder.matches(request.password(), user.getPassword())) {
            loginLimiter.recordFailure(clientIp, username);
            throw new AuthException(
                    "INVALID_CREDENTIALS",
                    HttpStatus.UNAUTHORIZED,
                    "Tên tài khoản hoặc mật khẩu không chính xác"
            );
        }

        if (!Boolean.TRUE.equals(user.getIsActive())) {
            loginLimiter.recordFailure(clientIp, username);
            throw new AuthException(
                    "ACCOUNT_INACTIVE",
                    HttpStatus.FORBIDDEN,
                    "Tài khoản đã bị khóa hoặc ngừng hoạt động"
            );
        }

        String accessToken = jwtService.generateToken(user);
        loginLimiter.reset(clientIp, username);
        return new LoginResult(
                accessToken,
                jwtService.getExpirationMs() / 1000,
                UserResponse.from(user)
        );
    }

    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(String username) {
        User user = userRepository.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new AuthException(
                        "USER_NOT_FOUND",
                        HttpStatus.UNAUTHORIZED,
                        "Không tìm thấy tài khoản của phiên đăng nhập"
                ));

        if (!Boolean.TRUE.equals(user.getIsActive())) {
            throw new AuthException(
                    "ACCOUNT_INACTIVE",
                    HttpStatus.FORBIDDEN,
                    "Tài khoản đã bị khóa hoặc ngừng hoạt động"
            );
        }

        return UserResponse.from(user);
    }
}
