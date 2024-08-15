package app.recipier.domain;

import io.micronaut.serde.annotation.Serdeable;
import jakarta.validation.constraints.NotEmpty;

@Serdeable
public record RecipeStep(int id, @NotEmpty String step) {
}
