package app.recipier.controller;

import app.recipier.dto.recipe.PostRecipe;
import app.recipier.dto.recipe.PostRecipeIngredient;
import app.recipier.dto.recipe.GetRecipe;
import app.recipier.dto.recipe.GetRecipeIngredient;
import app.recipier.dto.recipe.GetRecipeStep;
import jakarta.validation.Valid;
import org.jdbi.v3.core.Jdbi;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/recipe")
public class RecipeController {

    private final Jdbi jdbi;

    @Autowired
    public RecipeController(Jdbi jdbi) {
        this.jdbi = jdbi;
    }

    @GetMapping
    public List<GetRecipe> getRecipes() {
        return jdbi.inTransaction(handle -> handle
                .createQuery("""
                        SELECT id, name, description, created_at
                        FROM recipe
                        """)
                .map((row, ctx) ->
                        new GetRecipe(
                                row.getLong("id"),
                                row.getString("name"),
                                row.getString("description"),
                                row.getTimestamp("created_at").toInstant(),
                                Collections.emptyList(),
                                Collections.emptyList()
                        )
                )
                .list());
    }

    @PostMapping
    public List<GetRecipe> postRecipe(@Valid @RequestBody PostRecipe recipe) {
        final var createdAt = Instant.now();

        return jdbi.inTransaction(handle -> {
            var recipeId = handle.createUpdate("""
                            INSERT INTO recipe(name, description, created_at)
                            VALUES (:name, :description, :createdAt)
                            RETURNING id""")
                    .bind("name", recipe.name())
                    .bind("description", recipe.description())
                    .bind("createdAt", Timestamp.from(createdAt))
                    .executeAndReturnGeneratedKeys("id")
                    .mapTo(Long.class)
                    .one();

            List<PostRecipeIngredient> ingredientList = recipe.ingredients() != null ? recipe.ingredients() : Collections.emptyList();
            for (var ingredient : ingredientList) {
                handle.createUpdate("""
                                INSERT INTO recipe_ingredient(recipe_id, ingredient_id, unit_id, quantity)
                                VALUES (:recipeId, :ingredientId, :unitId, :quantity)""")
                        .bind("recipeId", recipeId)
                        .bind("ingredientId", ingredient.ingredientId())
                        .bind("unitId", ingredient.unitId())
                        .bind("quantity", ingredient.quantity())
                        .execute();
            }

            var stepNumber = 1;
            List<String> stepList = recipe.steps();
            for (var steps : stepList) {
                handle.createUpdate("""
                                INSERT INTO recipe_step(recipe_id, step_number, description)
                                VALUES (:recipeId, :stepNumber, :description)""")
                        .bind("recipeId", recipeId)
                        .bind("stepNumber", stepNumber)
                        .bind("description", steps)
                        .execute();
                stepNumber = stepNumber + 1;
            }

            // Read the recipe back from the database
            return getRecipes();
        });
    }

    @GetMapping("/{id}")
    public GetRecipe getRecipe(@PathVariable Long id) {
        return jdbi.inTransaction(handle -> {
                    var recipeSteps = handle.createQuery("""
                                    SELECT step_number, description
                                    FROM recipe_step
                                    WHERE recipe_id = :id
                                    """)
                            .bind("id", id)
                            .map((row, ctx) -> new GetRecipeStep(
                                    row.getLong("step_number"),
                                    row.getString("description")
                            ))
                            .list();

                    var recipeIngredients = handle.createQuery("""
                                    SELECT
                                        i.id as ingredient_id,
                                        u.id as unit_id,
                                        ri.quantity as quantity,
                                        i.name as ingredient_name,
                                        u.name as unit_name
                                    FROM recipe_ingredient ri
                                    LEFT JOIN ingredient i on ri.ingredient_id = i.id
                                    LEFT JOIN unit u on ri.unit_id = u.id
                                    WHERE ri.recipe_id = :id
                                    """)
                            .bind("id", id)
                            .map((row, ctx) -> new GetRecipeIngredient(
                                    row.getLong("unit_id"),
                                    row.getString("unit_name"),
                                    row.getLong("ingredient_id"),
                                    row.getString("ingredient_name"),
                                    row.getDouble("quantity")
                            ))
                            .list();

                    return handle.createQuery("""
                                    SELECT id, name, description, created_at
                                    FROM recipe
                                    WHERE id = :id
                                    """)
                            .bind("id", id)
                            .map((row, ctx) -> new GetRecipe(
                                    row.getLong("id"),
                                    row.getString("name"),
                                    row.getString("description"),
                                    row.getTimestamp("created_at").toInstant(),
                                    recipeIngredients,
                                    recipeSteps
                            ))
                            .one();
                }
        );
    }

}
