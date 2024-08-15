package app.recipier.domain;

import io.micronaut.serde.annotation.Serdeable;

@Serdeable
public record Mealtime(
    int id,
    int sequence,
    String name,
    String description
) {
}
