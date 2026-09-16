# syntax=docker/dockerfile:1.7@sha256:a57df69d0ea827fb7266491f2813635de6f17269be881f696fbfdf2d83dda33e

FROM --platform=$BUILDPLATFORM eclipse-temurin:17-jdk-alpine@sha256:638937c54b6d63f0973a20501973e7c433a36b1f22262bd2b25afa7be5ff8c4a AS builder

WORKDIR /workspace

COPY gradle ./gradle
COPY gradlew build.gradle settings.gradle ./

RUN sed -i 's/\r$//' gradlew \
    && chmod +x gradlew
RUN --mount=type=cache,target=/root/.gradle \
    ./gradlew --no-daemon dependencies

COPY src/main ./src/main

RUN --mount=type=cache,target=/root/.gradle \
    ./gradlew --no-daemon clean bootJar \
    && cp "$(find build/libs -maxdepth 1 -type f -name '*.jar' ! -name '*-plain.jar' -print -quit)" /workspace/lenshub.jar

FROM --platform=$TARGETPLATFORM eclipse-temurin:17-jre-alpine@sha256:02320dd4ce20e243dfb915c686089cf9315c763084fafbb12d5c9993aee18b57

ARG VCS_REF=unknown
ARG SOURCE_URL=https://github.com/ZzZueszZ/digital-rental

LABEL org.opencontainers.image.title="LensHub Backend" \
      org.opencontainers.image.description="LensHub ecommerce and camera rental API" \
      org.opencontainers.image.source="${SOURCE_URL}" \
      org.opencontainers.image.revision="${VCS_REF}"

RUN addgroup -S -g 10001 lenshub \
    && adduser -S -D -H -u 10001 -G lenshub lenshub \
    && mkdir -p /app \
    && chown -R lenshub:lenshub /app

WORKDIR /app

COPY --from=builder --chown=10001:10001 /workspace/lenshub.jar /app/lenshub.jar

ENV SPRING_PROFILES_ACTIVE=dev \
    JAVA_TOOL_OPTIONS="-Xms256m -Xmx768m -XX:+ExitOnOutOfMemoryError -Djava.io.tmpdir=/tmp"

USER 10001:10001

EXPOSE 8080

HEALTHCHECK --interval=10s --timeout=5s --start-period=60s --retries=6 \
    CMD wget -q -O /dev/null http://127.0.0.1:8080/api/actuator/health/readiness || exit 1

STOPSIGNAL SIGTERM

ENTRYPOINT ["java", "-jar", "/app/lenshub.jar"]
