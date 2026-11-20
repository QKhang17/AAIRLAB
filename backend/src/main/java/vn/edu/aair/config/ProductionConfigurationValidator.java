package vn.edu.aair.config;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * Fails fast when the production container was started without its required
 * external configuration. Values are never included in the exception text.
 */
@Component
@Profile("prod")
public class ProductionConfigurationValidator {

    @Value("${spring.datasource.url:}")
    private String databaseUrl;

    @Value("${spring.datasource.username:}")
    private String databaseUsername;

    @Value("${spring.datasource.password:}")
    private String databasePassword;

    @Value("${app.jwt.secret:}")
    private String jwtSecret;

    @Value("${app.cors.allowed-origin:}")
    private String frontendOrigin;

    @Value("${app.auth.cookie-secure:false}")
    private boolean secureCookies;

    @Value("${spring.mail.host:}")
    private String mailHost;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${spring.mail.password:}")
    private String mailPassword;

    @Value("${app.mail.from:}")
    private String mailFrom;

    @Value("${app.ai.gemini.api-key:}")
    private String geminiKey;

    @Value("${app.ai.groq.api-key:}")
    private String groqKey;

    @Value("${app.ai.openai.api-key:}")
    private String openAiKey;

    @Value("${app.ai.claude.api-key:}")
    private String claudeKey;

    @PostConstruct
    void validate() {
        require("spring.datasource.url", databaseUrl);
        require("spring.datasource.username", databaseUsername);
        require("spring.datasource.password", databasePassword);
        if (!databaseUrl.startsWith("jdbc:postgresql://")) {
            throw new IllegalStateException("Production database must use PostgreSQL");
        }

        require("app.jwt.secret", jwtSecret);
        if (jwtSecret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException("Production JWT secret must be at least 32 bytes");
        }

        require("app.cors.allowed-origin", frontendOrigin);
        if (!frontendOrigin.startsWith("https://") || frontendOrigin.contains("localhost")) {
            throw new IllegalStateException("Production frontend origin must be an HTTPS origin");
        }
        if (!secureCookies) {
            throw new IllegalStateException("Production authentication cookies must be Secure");
        }

        require("spring.mail.host", mailHost);
        require("spring.mail.username", mailUsername);
        require("spring.mail.password", mailPassword);
        require("app.mail.from", mailFrom);

        if (List.of(geminiKey, groqKey, openAiKey, claudeKey).stream().allMatch(this::blankOrPlaceholder)) {
            throw new IllegalStateException("At least one production AI provider key must be configured");
        }
    }

    private void require(String property, String value) {
        if (blankOrPlaceholder(value)) {
            throw new IllegalStateException("Missing required production configuration: " + property);
        }
    }

    private boolean blank(String value) {
        return value == null || value.isBlank();
    }

    private boolean blankOrPlaceholder(String value) {
        return blank(value)
                || value.contains("REPLACE_WITH_")
                || value.contains("example.com")
                || value.startsWith("YOUR_");
    }
}
