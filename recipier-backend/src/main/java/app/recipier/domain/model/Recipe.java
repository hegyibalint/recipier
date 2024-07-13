package app.recipier.domain.model;

import jakarta.annotation.Nullable;

import java.util.List;

public record Recipe(
        long id,
        String name,
        @Nullable String description,
        @Nullable List<Ingredient> ingredients
) {
}
