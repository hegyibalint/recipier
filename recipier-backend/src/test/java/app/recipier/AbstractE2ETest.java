package app.recipier;

import io.micronaut.runtime.server.EmbeddedServer;
import io.restassured.RestAssured;
import jakarta.inject.Inject;
import org.jdbi.v3.core.Jdbi;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;

public class AbstractE2ETest {

    @Inject
    private Jdbi jdbi;

    @Inject
    EmbeddedServer embeddedServer; // Injecting the embedded server

    @BeforeEach
    void setUp() {
        // Set RestAssured port to the embedded server port
        RestAssured.port = embeddedServer.getPort();
        // Start transaction
        jdbi.useHandle(handle -> handle.execute("BEGIN;"));
    }

    @AfterEach
    void tearDown() {
        // Rollback transaction
        jdbi.useHandle(handle -> handle.execute("ROLLBACK;"));
    }

}
