package app.recipier;

import io.restassured.RestAssured;
import io.restassured.filter.log.RequestLoggingFilter;
import io.restassured.filter.log.ResponseLoggingFilter;
import org.jdbi.v3.core.Jdbi;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.TestPropertySource;

@TestPropertySource(properties = "spring.profiles.active=test")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public abstract class BaseE2ETest {

    @LocalServerPort
    private int port;

    @Autowired
    protected Jdbi jdbi;

    @BeforeAll
    static void beforeAll() {
        // Ensure Testcontainers instance is initialized before tests
        TestPostgresContainer.getInstance();
    }

    @BeforeEach
    void setUp() {
        RestAssured.baseURI = "http://localhost";
        RestAssured.port = port;
        RestAssured.filters(new RequestLoggingFilter(), new ResponseLoggingFilter());

        // Clean up the database before each test to ensure isolation
        jdbi.useHandle(handle -> {
            handle.execute("TRUNCATE TABLE recipe CASCADE");
        });
    }
}
