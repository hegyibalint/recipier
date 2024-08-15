package app.recipier.domain;

import io.micronaut.serde.annotation.Serdeable;

@Serdeable
public record Meal(
        int id,
        String recipeName
) { }
