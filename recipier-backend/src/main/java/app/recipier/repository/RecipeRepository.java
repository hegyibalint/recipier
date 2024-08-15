package app.recipier.repository;

import app.recipier.db.Tables;
import app.recipier.domain.Recipe;
import app.recipier.domain.RecipeIngredient;
import app.recipier.domain.RecipeStep;
import app.recipier.domain.RecipeWithDetails;
import app.recipier.domain.request.NewRecipe;
import jakarta.inject.Singleton;
import org.jooq.DSLContext;

import java.util.List;
import java.util.Objects;

import static app.recipier.db.Tables.RECIPE_INGREDIENT;
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

    public RecipeWithDetails getForId(int id) {
        var recipe = dsl.selectFrom(RECIPE)
                .where(RECIPE.ID.eq(id))
                .fetchOneInto(Recipe.class);
        var ingredients = dsl.selectFrom(RECIPE_INGREDIENT)
                .where(RECIPE_INGREDIENT.RECIPE_ID.eq(id))
                .fetchInto(RecipeIngredient.class);
        var steps = dsl.selectFrom(Tables.RECIPE_STEP)
                .where(Tables.RECIPE_STEP.RECIPE_ID.eq(id))
                .fetchInto(RecipeStep.class);
        return new RecipeWithDetails(recipe.id(), recipe.name(), recipe.description(), recipe.createdAt(), ingredients, steps);
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
