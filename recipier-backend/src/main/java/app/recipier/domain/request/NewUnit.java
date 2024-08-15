package app.recipier.domain.request;

import app.recipier.domain.UnitType;
import io.micronaut.serde.annotation.Serdeable;
import jakarta.validation.constraints.NotNull;

@Serdeable
public record NewUnit(
        @NotNull UnitType type,
        @NotNull String name,
        @NotNull String abbreviation,
        String description
) {
}
