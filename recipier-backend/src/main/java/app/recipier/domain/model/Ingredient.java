package app.recipier.domain.model;

import io.micronaut.serde.annotation.Serdeable;

@Serdeable
public record Ingredient(
        long id,
        String name,
        String description
) {
}
