package app.recipier.dto.recipe;

import java.time.Instant;
import java.util.List;

public record GetRecipe(
        Long id,
        String name,
        String description,
        Instant createdAt,
        List<GetRecipeIngredient> ingredients,
        List<GetRecipeStep> steps
) {
}
