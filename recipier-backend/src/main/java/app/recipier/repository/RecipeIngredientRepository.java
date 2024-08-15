package app.recipier.repository;

import app.recipier.db.Tables;
import app.recipier.domain.RecipeIngredient;
import app.recipier.domain.request.NewRecipeIngredient;
import jakarta.inject.Singleton;
import org.jooq.DSLContext;

import java.util.List;
import java.util.Objects;

@Singleton
public class RecipeIngredientRepository {

    private final DSLContext dsl;

    public RecipeIngredientRepository(DSLContext dsl) {
        this.dsl = dsl;
    }

    public List<RecipeIngredient> getForRecipeId(int recipeId) {
        return dsl.selectFrom(Tables.RECIPE_INGREDIENT)
                .where(Tables.RECIPE_INGREDIENT.RECIPE_ID.eq(recipeId))
                .fetchInto(RecipeIngredient.class);
    }

    public RecipeIngredient create(NewRecipeIngredient newRecipeIngredient, int recipeId) {
        return Objects.requireNonNull(
                dsl.insertInto(Tables.RECIPE_INGREDIENT)
                        .set(Tables.RECIPE_INGREDIENT.RECIPE_ID, recipeId)
                        .set(Tables.RECIPE_INGREDIENT.INGREDIENT_ID, newRecipeIngredient.ingredientId())
                        .set(Tables.RECIPE_INGREDIENT.QUANTITY, newRecipeIngredient.amount())
                        .set(Tables.RECIPE_INGREDIENT.UNIT_ID, newRecipeIngredient.unitId())
                        .set(Tables.RECIPE_INGREDIENT.DESCRIPTION, newRecipeIngredient.description())
                        .returning()
                        .fetchOne(),
                "Recipe ingredient was not created"
        ).into(RecipeIngredient.class);
    }
}

