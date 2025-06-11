package app.recipier.dto.ingredient;

import java.math.BigDecimal;

public record GetIngredientConversion(
        Long id,
        Long fromUnitId,
        String fromUnitName,
        Long toUnitId,
        String toUnitName,
        BigDecimal factor,
        String description
) {
}
