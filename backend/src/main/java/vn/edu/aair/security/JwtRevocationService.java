package vn.edu.aair.security;

import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

/**
 * Revokes JWT IDs until their natural expiry. Use a shared store for multi-node deployments.
 */
@Component
public class JwtRevocationService {
    private final Map<String, Instant> revoked = new HashMap<>();

    public synchronized void revoke(String tokenId, Instant expiresAt) {
        if (tokenId == null || tokenId.isBlank() || expiresAt == null || !expiresAt.isAfter(Instant.now())) return;
        purgeExpired();
        revoked.put(tokenId, expiresAt);
    }

    public synchronized boolean isRevoked(String tokenId) {
        if (tokenId == null || tokenId.isBlank()) return false;
        purgeExpired();
        return revoked.containsKey(tokenId);
    }

    private void purgeExpired() {
        Instant now = Instant.now();
        Iterator<Map.Entry<String, Instant>> iterator = revoked.entrySet().iterator();
        while (iterator.hasNext()) {
            if (!iterator.next().getValue().isAfter(now)) iterator.remove();
        }
    }
}
