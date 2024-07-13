package app.recipier.domain.request;

import jakarta.annotation.Nullable;

import java.util.List;

public record CreateRecipeRequest(
        String name,
        @Nullable String description,
        List<CreateRecipeIngredient> ingredients
) {
}

