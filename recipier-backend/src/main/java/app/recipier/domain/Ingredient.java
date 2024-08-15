package app.recipier.domain;

import app.recipier.db.tables.records.IngredientRecord;
import io.micronaut.serde.annotation.Serdeable;

@Serdeable
public record Ingredient(
        int id,
        String name,
        String description
) {
    public static Ingredient from(IngredientRecord record) {
        return new Ingredient(record.getId(), record.getName(), record.getDescription());
    }
}
