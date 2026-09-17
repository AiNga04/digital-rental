# ==========================================
# Bước 1: Môi trường Build (Dịch mã nguồn)
# ==========================================
# Dùng bộ công cụ JDK 17 để dịch mã Java
FROM eclipse-temurin:17-jdk-alpine AS builder

WORKDIR /workspace

# Copy các file cấu hình của Gradle vào trước để tải thư viện 
# (Việc này giúp Docker cache lại thư viện, lần sau build sẽ rất nhanh)
COPY gradle ./gradle
COPY gradlew build.gradle settings.gradle ./

# Sửa lỗi ký tự dòng \r của Windows (nếu có) và cấp quyền chạy cho gradlew
RUN sed -i 's/\r$//' gradlew && chmod +x gradlew

# Tải trước các thư viện về
RUN ./gradlew --no-daemon dependencies

# Copy thư mục chứa code thật sự vào
COPY src/main ./src/main

# Build mã nguồn ra thành một file chạy duy nhất (.jar)
RUN ./gradlew --no-daemon clean bootJar \
    && cp build/libs/*-SNAPSHOT.jar /workspace/lenshub.jar


# ==========================================
# Bước 2: Môi trường Chạy (Production)
# ==========================================
# Thay vì dùng JDK nặng nề, ta chỉ dùng JRE (Java Runtime) cực nhẹ để chạy app.
FROM eclipse-temurin:17-jre-alpine

# Bảo mật: Tạo một user riêng tên 'lenshub', không dùng quyền root của Docker.
RUN addgroup -S lenshub && adduser -S lenshub -G lenshub

WORKDIR /app

# Chỉ copy đúng file lenshub.jar đã build ở Bước 1 sang đây. Bỏ lại toàn bộ source code!
COPY --from=builder --chown=lenshub:lenshub /workspace/lenshub.jar /app/lenshub.jar

# Cấu hình bộ nhớ RAM và profile chạy
ENV SPRING_PROFILES_ACTIVE=prod
ENV JAVA_OPTS="-Xms256m -Xmx768m"

# Chỉ định Container chạy dưới quyền của user 'lenshub'
USER lenshub:lenshub

# Ứng dụng Spring Boot mở cổng 8080
EXPOSE 8080

# Lệnh khởi động app khi Container chạy
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/lenshub.jar"]
