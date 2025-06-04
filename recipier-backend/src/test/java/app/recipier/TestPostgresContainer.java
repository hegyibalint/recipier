package app.recipier;

import org.testcontainers.containers.PostgreSQLContainer;

public class TestPostgresContainer {
    private static final PostgreSQLContainer<?> CONTAINER = 
        new PostgreSQLContainer<>("postgres:16")
            .withReuse(true);

    static {
        CONTAINER.start();  // Ensure the container is started only once
        System.setProperty("spring.datasource.url", CONTAINER.getJdbcUrl());
        System.setProperty("spring.datasource.username", CONTAINER.getUsername());
        System.setProperty("spring.datasource.password", CONTAINER.getPassword());
    }

    public static PostgreSQLContainer<?> getInstance() {
        return CONTAINER;
    }
}