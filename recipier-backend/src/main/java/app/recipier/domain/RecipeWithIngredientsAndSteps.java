package app.recipier.domain;

import io.micronaut.serde.annotation.Serdeable;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;
import java.util.List;

@Serdeable
public record RecipeWithIngredientsAndSteps(
        int id,
        @NotNull String name,
        String description,
        @NotNull LocalDateTime createdAt,
        List<RecipeIngredient> ingredients,
        List<RecipeStep> steps
) {
}
