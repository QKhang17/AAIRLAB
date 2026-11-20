FROM maven:3.9.11-eclipse-temurin-21 AS build

WORKDIR /workspace/backend
COPY backend/pom.xml ./pom.xml
RUN mvn -B -ntp dependency:go-offline

COPY backend/src ./src
RUN mvn -B -ntp -DskipTests clean package

# A production artifact must never contain an external secret file.
RUN ! jar tf .build/aair-backend-1.0.0.jar | grep -Eiq '(^|/)(application-ai-keys\.yml|[^/]*\.env|secrets/|[^/]*\.(pem|key|p12|jks))$'

FROM eclipse-temurin:21-jre-jammy

RUN apt-get update \
    && apt-get install --no-install-recommends -y curl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system --gid 10001 aair \
    && useradd --system --uid 10001 --gid 10001 --home-dir /app --shell /usr/sbin/nologin aair

WORKDIR /app
COPY --from=build /workspace/backend/.build/aair-backend-1.0.0.jar /app/aair-backend.jar
RUN mkdir -p /app/uploads && chown -R aair:aair /app

ENV SPRING_PROFILES_ACTIVE=prod \
    AI_KEYS_FILE=/run/secrets/aair-application.yml \
    UPLOAD_DIRECTORY=/app/uploads

USER 10001:10001
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=45s --retries=3 \
    CMD curl --fail --silent http://127.0.0.1:8080/actuator/health || exit 1

ENTRYPOINT ["java", "-jar", "/app/aair-backend.jar"]
