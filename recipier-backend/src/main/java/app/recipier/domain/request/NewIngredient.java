package app.recipier.domain.request;

import jakarta.validation.constraints.NotNull;

public record NewIngredient(@NotNull String name, String description) {
}
