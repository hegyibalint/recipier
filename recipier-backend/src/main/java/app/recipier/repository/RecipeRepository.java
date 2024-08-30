package app.recipier.repository;

import app.recipier.domain.Recipe;
import app.recipier.domain.RecipeWithIngredientsAndSteps;
import app.recipier.domain.request.NewRecipe;
import jakarta.inject.Singleton;
import org.jooq.DSLContext;

import java.util.List;
import java.util.Objects;

import static app.recipier.db.tables.Recipe.RECIPE;

@Singleton
public class RecipeRepository {

    private final DSLContext dsl;

    public RecipeRepository(DSLContext dsl) {
        this.dsl = dsl;
    }

    public List<Recipe> getAll() {
        return dsl.selectFrom(RECIPE).fetchInto(Recipe.class);
    }

    public RecipeWithIngredientsAndSteps getForId(int id) {
        var recipe = dsl.select(
                RECIPE.ID,
                RECIPE.NAME,
                RECIPE.DESCRIPTION,
                RECIPE.CREATED_AT,
        )
        return new RecipeWithIngredientsAndSteps(recipe.id(), recipe.name(), recipe.description(), recipe.createdAt(), ingredients, steps);
    }

    public Recipe create(NewRecipe createRecipeRequest) {
        return Objects.requireNonNull(
                dsl.insertInto(RECIPE)
                        .set(RECIPE.NAME, createRecipeRequest.name())
                        .set(RECIPE.DESCRIPTION, createRecipeRequest.description())
                        .returning()
                        .fetchOne(),
                "Recipe was not created"
        ).into(Recipe.class);
    }
}
