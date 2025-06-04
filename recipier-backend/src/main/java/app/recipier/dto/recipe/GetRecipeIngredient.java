package app.recipier.dto.recipe;

public record  GetRecipeIngredient(
        long unitId,
        String unitName,
        long ingredientId,
        String ingredientName,
        double quantity
){
}
