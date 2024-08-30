package app.recipier.repository;

import app.recipier.db.Tables;
import app.recipier.domain.Ingredient;
import app.recipier.domain.request.NewIngredient;
import jakarta.inject.Singleton;
import org.jooq.DSLContext;

import java.util.List;
import java.util.Objects;

@Singleton
public class IngredientsRepository {

    private final DSLContext dsl;

    public IngredientsRepository(DSLContext dsl) {
        this.dsl = dsl;
    }

    public List<Ingredient> getAll() {
        return dsl.selectFrom(Tables.INGREDIENT)
                .fetchInto(Ingredient.class);
    }

    public Ingredient create(NewIngredient newIngredient) {

    }
}
