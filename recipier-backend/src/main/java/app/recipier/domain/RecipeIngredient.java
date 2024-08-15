package app.recipier.domain;

import io.micronaut.serde.annotation.Serdeable;
import jakarta.validation.constraints.Min;

@Serdeable
public record RecipeIngredient(
        int id,
        int recipeId,
        @Min(0) double amount,
        String description) {
}
