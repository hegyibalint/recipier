package app.recipier.dto.recipe;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record PostRecipe(
        @NotEmpty String name,
        String description,
        List<PostRecipeIngredient> ingredients,
        List<String> steps
) {
}
