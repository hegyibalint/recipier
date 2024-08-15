package app.recipier.domain.request;

import java.time.LocalDate;

public record NewMeal(
        LocalDate date,
        int mealtimeId,
        int recipeId
) {
}
