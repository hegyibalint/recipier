package app.recipier.repository;

import app.recipier.db.Tables;
import app.recipier.domain.model.Ingredient;
import jakarta.inject.Singleton;
import org.jooq.DSLContext;
import org.jooq.impl.DSL;

import java.util.List;

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

}
