package app.recipier.controller;

import app.recipier.dto.ingredient.*;
import org.jdbi.v3.core.Jdbi;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/ingredient")
public class IngredientController {

    private final Jdbi jdbi;

    @Autowired
    public IngredientController(Jdbi jdbi) {
        this.jdbi = jdbi;
    }

    @GetMapping
    public List<GetIngredient> getIngredients() {
        return jdbi.inTransaction(handle -> {
            var ingredients = handle
                    .createQuery("""
                            SELECT id, name, description
                            FROM ingredient
                            """)
                    .map((row, ctx) ->
                            new GetIngredient(
                                    row.getLong("id"),
                                    row.getString("name"),
                                    row.getString("description"),
                                    List.of()
                            )
                    )
                    .list();

            var allConversions = handle
                    .createQuery("""
                            SELECT ic.id, ic.from_unit_id, ic.to_unit_id, ic.factor, ic.description,
                                   fu.name as from_unit_name, tu.name as to_unit_name
                            FROM ingredient_conversion ic
                            JOIN unit fu ON ic.from_unit_id = fu.id
                            JOIN unit tu ON ic.to_unit_id = tu.id
                            """)
                    .map((row, ctx) -> new GetIngredientConversion(
                            row.getLong("id"),
                            row.getLong("from_unit_id"),
                            row.getString("from_unit_name"),
                            row.getLong("to_unit_id"),
                            row.getString("to_unit_name"),
                            row.getBigDecimal("factor"),
                            row.getString("description")
                    ))
                    .list();

            return ingredients.stream()
                    .map(ingredient -> {
                        var conversions = allConversions.stream()
                                .filter(c -> c.fromUnitId().equals(ingredient.id()) || c.toUnitId().equals(ingredient.id()))
                                .collect(Collectors.toList());

                        return new GetIngredient(
                                ingredient.id(),
                                ingredient.name(),
                                ingredient.description(),
                                conversions
                        );
                    })
                    .toList();
        });
    }

    @PostMapping
    public List<GetIngredient> postIngredient(@RequestBody PostIngredient ingredient) {
        return jdbi.inTransaction(handle -> {
            handle.createUpdate("""
                            INSERT INTO ingredient(name, description)
                            VALUES (:name, :description)
                            RETURNING id""")
                    .bind("name", ingredient.name())
                    .bind("description", ingredient.description())
                    .executeAndReturnGeneratedKeys("id")
                    .mapTo(Long.class)
                    .one();
            return getIngredients();
        });
    }

    @PutMapping
    public GetIngredient putIngredient(@RequestBody PutIngredient ingredient) {
        return jdbi.inTransaction(handle -> {
            handle.createUpdate("""
                            UPDATE ingredient
                            SET name = :name, description = :description
                            WHERE id = :id""")
                    .bind("id", ingredient.id())
                    .bind("name", ingredient.name())
                    .bind("description", ingredient.description())
                    .execute();
            return getIngredient(ingredient.id());
        });
    }

    @GetMapping("/{id}")
    public GetIngredient getIngredient(@PathVariable Long id) {
        return jdbi.inTransaction(handle -> {
            var conversions = handle
                    .createQuery("""
                            SELECT ic.id, ic.from_unit_id, ic.to_unit_id, ic.factor, ic.description
                            FROM ingredient_conversion ic
                            WHERE ic.from_unit_id = :ingredientId OR ic.to_unit_id = :ingredientId
                            """)
                    .bind("ingredientId", id)
                    .map((row, ctx) -> new GetIngredientConversion(
                            row.getLong("id"),
                            row.getLong("from_unit_id"),
                            row.getString("from_unit_name"),
                            row.getLong("to_unit_id"),
                            row.getString("to_unit_name"),
                            row.getBigDecimal("factor"),
                            row.getString("description")
                    ))
                    .list();

            var ingredient = handle
                    .createQuery("""
                            SELECT id, name, description
                            FROM ingredient
                            WHERE id = :id
                            """)
                    .bind("id", id)
                    .map((row, ctx) ->
                            new GetIngredient(
                                    row.getLong("id"),
                                    row.getString("name"),
                                    row.getString("description"),
                                    conversions
                            )
                    )
                    .one();

            return new GetIngredient(
                    ingredient.id(),
                    ingredient.name(),
                    ingredient.description(),
                    conversions
            );
        });
    }

    @PostMapping("/{id}/conversions")
    public GetIngredient postIngredientConversion(@PathVariable Long id, @RequestBody PostIngredientConversion conversion) {
        return jdbi.inTransaction(handle -> {
            handle.createUpdate("""
                            INSERT INTO ingredient_conversion (from_unit_id, to_unit_id, factor, description)
                            VALUES (:fromUnitId, :toUnitId, :factor, :description)""")
                    .bind("fromUnitId", conversion.fromUnitId())
                    .bind("toUnitId", conversion.toUnitId())
                    .bind("factor", conversion.factor())
                    .bind("description", conversion.description())
                    .execute();
            return getIngredient(id);
        });
    }

    @PutMapping("/{id}/conversions/{conversionId}")
    public GetIngredient putIngredientConversion(@PathVariable Long id, @PathVariable Long conversionId, @RequestBody PutIngredientConversion conversion) {
        return jdbi.inTransaction(handle -> {
            handle.createUpdate("""
                            UPDATE ingredient_conversion
                            SET from_unit_id = :fromUnitId, to_unit_id = :toUnitId, factor = :factor, description = :description
                            WHERE id = :conversionId""")
                    .bind("conversionId", conversionId)
                    .bind("fromUnitId", conversion.fromUnitId())
                    .bind("toUnitId", conversion.toUnitId())
                    .bind("factor", conversion.factor())
                    .bind("description", conversion.description())
                    .execute();
            return getIngredient(id);
        });
    }

    @DeleteMapping("/{id}/conversions/{conversionId}")
    public GetIngredient deleteIngredientConversion(@PathVariable Long id, @PathVariable Long conversionId) {
        return jdbi.inTransaction(handle -> {
            handle.createUpdate("""
                            DELETE FROM ingredient_conversion
                            WHERE id = :conversionId""")
                    .bind("conversionId", conversionId)
                    .execute();
            return getIngredient(id);
        });
    }

}
