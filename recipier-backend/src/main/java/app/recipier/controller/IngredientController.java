package app.recipier.controller;

import app.recipier.dto.ingredient.PostIngredient;
import app.recipier.dto.ingredient.GetIngredient;
import app.recipier.dto.ingredient.GetIngredientConversion;
import app.recipier.dto.ingredient.PostIngredientConversion;
import org.jdbi.v3.core.Jdbi;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
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
                                    List.of(),
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
                            row.getLong("to_unit_id"),
                            row.getBigDecimal("factor"),
                            row.getString("description")
                    ))
                    .list();

            var conversionsByIngredient = allConversions.stream()
                    .collect(Collectors.groupingBy(conv -> conv.fromUnitId()));

            return ingredients.stream()
                    .map(ingredient -> {
                        var conversions = conversionsByIngredient.getOrDefault(ingredient.id(), List.of());
                        var convertedUnits = conversions.stream()
                                .map(GetIngredientConversion::toUnitId)
                                .distinct()
                                .toList();
                        return new GetIngredient(
                                ingredient.id(),
                                ingredient.name(),
                                ingredient.description(),
                                conversions,
                                convertedUnits
                        );
                    })
                    .toList();
        });
    }

    @PostMapping
    public List<GetIngredient> postIngredient(@RequestBody PostIngredient ingredient) {
        return jdbi.inTransaction(handle -> {
            var ingredientId = handle.createUpdate("""
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

    @GetMapping("/{id}")
    public GetIngredient getIngredient(@PathVariable Long id) {
        return jdbi.inTransaction(handle -> {
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
                                    List.of(),
                                    List.of()
                            )
                    )
                    .one();

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
                            row.getLong("to_unit_id"),
                            row.getBigDecimal("factor"),
                            row.getString("description")
                    ))
                    .list();

            var convertedUnits = conversions.stream()
                    .map(GetIngredientConversion::toUnitId)
                    .distinct()
                    .toList();

            return new GetIngredient(
                    ingredient.id(),
                    ingredient.name(),
                    ingredient.description(),
                    conversions,
                    convertedUnits
            );
        });
    }

    @PostMapping("/conversion")
    public GetIngredientConversion postIngredientConversion(@RequestBody PostIngredientConversion conversion) {
        return jdbi.inTransaction(handle -> {
            var conversionId = handle.createUpdate("""
                            INSERT INTO ingredient_conversion(from_unit_id, to_unit_id, factor, description)
                            VALUES (:fromUnitId, :toUnitId, :factor, :description)
                            """)
                    .bind("fromUnitId", conversion.fromUnitId())
                    .bind("toUnitId", conversion.toUnitId())
                    .bind("factor", conversion.factor())
                    .bind("description", conversion.description())
                    .executeAndReturnGeneratedKeys("id")
                    .mapTo(Long.class)
                    .one();

            return new GetIngredientConversion(
                    conversionId,
                    conversion.fromUnitId(),
                    conversion.toUnitId(),
                    conversion.factor(),
                    conversion.description()
            );
        });
    }

    @GetMapping("/conversion")
    public List<GetIngredientConversion> getIngredientConversions() {
        return jdbi.inTransaction(handle -> handle
                .createQuery("""
                        SELECT id, from_unit_id, to_unit_id, factor, description
                        FROM ingredient_conversion
                        """)
                .map((row, ctx) -> new GetIngredientConversion(
                        row.getLong("id"),
                        row.getLong("from_unit_id"),
                        row.getLong("to_unit_id"),
                        row.getBigDecimal("factor"),
                        row.getString("description")
                ))
                .list());
    }

}
