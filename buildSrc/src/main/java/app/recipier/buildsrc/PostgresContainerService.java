package app.recipier.buildsrc;

import org.gradle.api.services.BuildService;
import org.gradle.api.services.BuildServiceParameters;
import org.testcontainers.containers.PostgreSQLContainer;

public abstract class PostgresContainerService implements BuildService<BuildServiceParameters.None>, AutoCloseable {

    private final PostgreSQLContainer<?> container;

    @SuppressWarnings("resource")
    public PostgresContainerService() {
        container = new PostgreSQLContainer<>("postgres:16")
                .withDatabaseName("recipier")
                .withUsername("postgres")
                .withPassword("postgres");
    }

    public int getExposedPort() {
        if (!container.isRunning()) {
            container.start();
        }
        return container.getFirstMappedPort();
    }

    @Override
    public void close() {
        if (container != null) {
            container.stop();
        }
    }

}
