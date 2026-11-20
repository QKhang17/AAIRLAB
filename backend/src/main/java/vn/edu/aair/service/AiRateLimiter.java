package vn.edu.aair.service;

import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.HashMap;
import java.util.Map;

/**
 * A bounded per-user AI quota for the single-node deployment.
 * Production clusters should back this policy with Redis or another shared store.
 */
@Component
public class AiRateLimiter {
    private static final int MAX_REQUESTS = 5;
    private static final int MAX_USERS = 10_000;
    private static final Duration WINDOW = Duration.ofMinutes(15);

    private final Map<Long, ArrayDeque<Instant>> requests = new HashMap<>();

    public synchronized boolean tryAcquire(long userId) {
        Instant now = Instant.now();
        Instant cutoff = now.minus(WINDOW);
        var timestamps = requests.computeIfAbsent(userId, ignored -> new ArrayDeque<>());
        while (!timestamps.isEmpty() && timestamps.peekFirst().isBefore(cutoff)) {
            timestamps.removeFirst();
        }
        if (timestamps.size() >= MAX_REQUESTS) return false;
        timestamps.addLast(now);
        evictEmptyUsers();
        if (requests.size() > MAX_USERS) requests.remove(requests.keySet().iterator().next());
        return true;
    }

    private void evictEmptyUsers() {
        requests.entrySet().removeIf(entry -> entry.getValue().isEmpty());
    }
}
