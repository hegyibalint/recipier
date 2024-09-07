package app.recipier.domain;

import io.micronaut.serde.annotation.Serdeable;
import jakarta.validation.constraints.NotNull;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMappers;

@Serdeable
public record Unit(
        @NotNull int id,
        @NotNull UnitType type,
        @NotNull String name,
        @NotNull String abbreviation,
        String description
) {
}
