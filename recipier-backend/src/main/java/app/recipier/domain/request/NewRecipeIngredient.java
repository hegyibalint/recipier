package app.recipier.domain.request;

import io.micronaut.serde.annotation.Serdeable;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

@Serdeable
public record NewRecipeIngredient(
        @NotNull int ingredientId,
        @NotNull int unitId,
        @Min(0) double amount,
        String description
) { }
