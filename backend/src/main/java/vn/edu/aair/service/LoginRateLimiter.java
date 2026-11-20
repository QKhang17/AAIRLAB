package vn.edu.aair.service;

import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

/** Small bounded in-process limiter for login failures. Use a shared store in multi-instance production. */
@Component
public class LoginRateLimiter {
    private static final int MAX_FAILURES = 10;
    private static final int MAX_ENTRIES = 10_000;
    private static final Duration WINDOW = Duration.ofMinutes(15);

    private final Map<String, Window> failures = new LinkedHashMap<>(128, 0.75f, true);

    public synchronized boolean isBlocked(String clientIp, String username) {
        String key = key(clientIp, username);
        Window window = failures.get(key);
        if (window == null) return false;
        if (expired(window)) {
            failures.remove(key);
            return false;
        }
        return window.count() >= MAX_FAILURES;
    }

    public synchronized void recordFailure(String clientIp, String username) {
        Instant now = Instant.now();
        String key = key(clientIp, username);
        Window current = failures.get(key);
        Window next = current == null || expired(current)
                ? new Window(now, 1)
                : new Window(current.startedAt(), current.count() + 1);
        failures.put(key, next);
        while (failures.size() > MAX_ENTRIES) failures.remove(failures.keySet().iterator().next());
    }

    public synchronized void reset(String clientIp, String username) {
        failures.remove(key(clientIp, username));
    }

    private boolean expired(Window window) {
        return window.startedAt().plus(WINDOW).isBefore(Instant.now());
    }

    private String key(String clientIp, String username) {
        String ip = clientIp == null || clientIp.isBlank() ? "unknown" : clientIp.trim();
        String user = username == null ? "" : username.trim().toLowerCase(Locale.ROOT);
        return ip + "\u0000" + user;
    }

    private record Window(Instant startedAt, int count) {}
}
