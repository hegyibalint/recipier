package app.recipier.repository;

import app.recipier.domain.RecipeStep;
import app.recipier.domain.request.NewRecipeStep;
import jakarta.inject.Singleton;
import org.jooq.DSLContext;

import java.util.List;
import java.util.Objects;

@Singleton
public class RecipeStepRepository {

    private final DSLContext dsl;

    public RecipeStepRepository(DSLContext dsl) {
        this.dsl = dsl;
    }

    public List<RecipeStep> getAllForRecipe(int recipeId) {
        return dsl.selectFrom(app.recipier.db.tables.RecipeStep.RECIPE_STEP)
                .where(app.recipier.db.tables.RecipeStep.RECIPE_STEP.RECIPE_ID.eq(recipeId))
                .fetchInto(RecipeStep.class);
    }

    public RecipeStep create(int recipeId, NewRecipeStep newRecipeStep) {
        return Objects.requireNonNull(dsl.insertInto(app.recipier.db.tables.RecipeStep.RECIPE_STEP)
                        .set(dsl.newRecord(app.recipier.db.tables.RecipeStep.RECIPE_STEP, newRecipeStep).setRecipeId(recipeId))
                        .returning()
                        .fetchOne(),
                "Recipe step was not created"
        ).into(RecipeStep.class);
    }
}
