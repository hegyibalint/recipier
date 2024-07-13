package app.recipier.repository;

import app.recipier.domain.model.Ingredient;
import jakarta.inject.Singleton;
import org.jooq.DSLContext;

import java.util.List;

import static app.recipier.db.Tables.INGREDIENT;

@Singleton
public class IngredientsRepository {

    private final DSLContext dsl;

    public IngredientsRepository(DSLContext dsl) {
        this.dsl = dsl;
    }

    public List<Ingredient> getLike(String name) {
        return dsl.selectFrom(INGREDIENT)
                .where(INGREDIENT.NAME.similarTo(name))
                .limit(10)
                .fetchInto(Ingredient.class);
    }

}
