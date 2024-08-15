package app.recipier.domain;

import io.micronaut.serde.annotation.Serdeable;
import jakarta.validation.constraints.NotNull;

@Serdeable
public record Unit(
        @NotNull int id,
        @NotNull UnitType type,
        @NotNull String name,
        @NotNull String abbreviation,
        String description
) {
}
