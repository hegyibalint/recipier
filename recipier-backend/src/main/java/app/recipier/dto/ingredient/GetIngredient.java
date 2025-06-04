package app.recipier.dto.ingredient;

import java.util.List;

public record GetIngredient(
        Long id,
        String name,
        String description,
        List<GetIngredientConversion> conversions,
        List<Long> convertedUnits
) {
}
