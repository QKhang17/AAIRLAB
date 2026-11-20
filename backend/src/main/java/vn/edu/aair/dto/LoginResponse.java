package vn.edu.aair.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;

public record LoginResponse(
        @JsonIgnore
        String accessToken,
        String tokenType,
        long expiresIn,
        UserResponse user
) {
}
