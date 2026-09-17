package org.web.configs;

import org.junit.jupiter.api.Test;
import org.springframework.boot.env.YamlPropertySourceLoader;
import org.springframework.core.env.PropertySource;
import org.springframework.core.io.ClassPathResource;

import java.io.IOException;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class ProductionProfileConfigTest {

    private final List<PropertySource<?>> propertySources = loadProductionProperties();

    @Test
    void disablesFlywayAndUsesHibernateUpdate() {
        assertProperty("spring.flyway.enabled", "false");
        assertProperty("spring.flyway.baseline-on-migrate", "${FLYWAY_BASELINE_ON_MIGRATE:false}");
        assertProperty("spring.jpa.hibernate.ddl-auto", "update");
        assertProperty("spring.sql.init.mode", "never");
    }

    @Test
    void exposesOnlySanitizedHealthProbes() {
        assertProperty("management.endpoints.web.exposure.include", "health");
        assertProperty("management.endpoint.health.show-details", "never");
        assertProperty("management.endpoint.health.probes.enabled", "true");
        assertProperty("springdoc.api-docs.enabled", "false");
        assertProperty("springdoc.swagger-ui.enabled", "false");
    }

    @Test
    void requiresProductionSecretsAndUsesFptProvider() {
        assertProperty("spring.datasource.password", "${DB_PASSWORD}");
        assertProperty("app.storage.minio.access-key", "${MINIO_ACCESS_KEY}");
        assertProperty("app.storage.minio.secret-key", "${MINIO_SECRET_KEY}");
        assertProperty("app.activation.jwt-secret", "${APP_ACTIVATION_JWT_SECRET}");
        assertProperty("app.kyc.provider", "fpt");
        assertProperty("app.kyc.fpt.api-key", "${FPT_KYC_API_KEY}");
    }

    @Test
    void usesResendWithoutRequiringSmtpCredentials() {
        assertProperty("app.mail.provider", "resend");
        assertProperty("app.mail.resend.api-key", "${RESEND_API_KEY}");
        assertNull(property("spring.mail.username"));
        assertNull(property("spring.mail.password"));
    }

    private void assertProperty(String name, String expected) {
        assertEquals(expected, String.valueOf(property(name)));
    }

    private Object property(String name) {
        return propertySources.stream()
                .map(source -> source.getProperty(name))
                .filter(value -> value != null)
                .findFirst()
                .orElse(null);
    }

    private static List<PropertySource<?>> loadProductionProperties() {
        try {
            return new YamlPropertySourceLoader().load(
                    "application-prod",
                    new ClassPathResource("application-prod.yml")
            );
        } catch (IOException exception) {
            throw new IllegalStateException("Cannot load application-prod.yml", exception);
        }
    }
}
