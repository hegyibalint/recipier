package app.recipier.dto.ingredient;

import java.math.BigDecimal;

public record PutIngredientConversion(
        Long fromUnitId,
        Long toUnitId,
        BigDecimal factor,
        String description
) {
}