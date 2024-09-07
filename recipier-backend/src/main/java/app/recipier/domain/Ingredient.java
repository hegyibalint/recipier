package app.recipier.domain;

import io.micronaut.serde.annotation.Serdeable;

@Serdeable
public record Ingredient(
        int id,
        String name,
        String description
) {
}
