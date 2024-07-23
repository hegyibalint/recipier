package app.recipier.domain.model;

import io.micronaut.serde.annotation.Serdeable;

@Serdeable
public record Unit(
        long id,
        UnitType type,
        String name,
        String abbreviation,
        String description
) {
}
