package app.recipier.domain.request;

import io.micronaut.serde.annotation.Serdeable;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

@Serdeable
public record NewRecipe(@NotEmpty String name, String description, List<NewRecipeIngredient> ingredients, List<NewRecipeStep> steps) {
}
