package app.recipier;

import io.micronaut.test.extensions.junit5.annotation.MicronautTest;
import jakarta.inject.Inject;
import org.jooq.DSLContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@MicronautTest
@Testcontainers
public class AbstractDatabaseTest {

    @Container
    protected static final PostgreSQLContainer<?> container = new PostgreSQLContainer<>("postgres:16")
            .withDatabaseName("recipier")
            .withUsername("postgres")
            .withPassword("postgres");

    @Inject
    DSLContext dslContext;

    @BeforeAll
    public static void setup() {
        container.start();
        System.setProperty("micronaut.environments", "test");
        System.setProperty("datasources.default.url", container.getJdbcUrl());
        System.setProperty("datasources.default.username", container.getUsername());
        System.setProperty("datasources.default.password", container.getPassword());
    }

    @BeforeEach
    void setUp() {
        // Start a transaction before each test, keeping the current values intact
        dslContext.startTransaction().execute();
    }

    @AfterEach
    void tearDown() {
        // Rollback the transaction after each test
        dslContext.rollback().execute();
    }

}
