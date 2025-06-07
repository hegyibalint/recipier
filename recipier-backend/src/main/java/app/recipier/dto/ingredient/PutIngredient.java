package app.recipier.dto.ingredient;

public record PutIngredient(
        Long id,
        String name,
        String description
) {
}