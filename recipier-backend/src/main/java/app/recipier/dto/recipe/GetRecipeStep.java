package app.recipier.dto.recipe;

public record GetRecipeStep(
        Long stepNumber,
        String description
) {
}
