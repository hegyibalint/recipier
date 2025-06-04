package app.recipier.dto.recipe;

public record PostRecipeIngredient(
        long ingredientId,
        long unitId,
        double quantity
) {
}
