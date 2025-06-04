package app.recipier.dto.ingredient;

import java.math.BigDecimal;

public record GetIngredientConversion(
        Long id,
        Long fromUnitId,
        Long toUnitId,
        BigDecimal factor,
        String description
) {
}
