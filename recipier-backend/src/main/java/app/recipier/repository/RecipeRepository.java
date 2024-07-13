package app.recipier.repository;

import app.recipier.domain.request.CreateRecipeRequest;
import jakarta.inject.Singleton;
import org.jooq.DSLContext;

import static app.recipier.db.tables.Recipe.RECIPE;

@Singleton
public class RecipeRepository {

    private final DSLContext dsl;

    public RecipeRepository(DSLContext dsl) {
        this.dsl = dsl;
    }

    public long create(CreateRecipeRequest createRecipeRequest) {
        return dsl.insertInto(RECIPE)
                .set(RECIPE.NAME, createRecipeRequest.name())
                .set(RECIPE.DESCRIPTION, createRecipeRequest.description())
                .returning(RECIPE.ID)
                .execute();
    }
}
