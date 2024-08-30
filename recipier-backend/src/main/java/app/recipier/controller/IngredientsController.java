package app.recipier.controller;

import app.recipier.db.Tables;
import app.recipier.domain.Ingredient;
import app.recipier.domain.request.NewIngredient;
import io.micronaut.http.annotation.Controller;
import io.micronaut.http.annotation.Get;
import org.jooq.DSLContext;

import java.util.List;
import java.util.Objects;

@Controller("/ingredients")
public class IngredientsController {

    private final DSLContext dsl;

    public IngredientsController(DSLContext dsl) {
        this.dsl = dsl;
    }

    @Get()
    public List<Ingredient> getAll() {
        dsl.selectFrom(Tables.INGREDIENT).fetchInto(Ingredient.class);
    }

    public Ingredient create(NewIngredient newIngredient) {
        return Objects.requireNonNull(
                dsl.insertInto(Tables.INGREDIENT)
                        .set(Tables.INGREDIENT.NAME, newIngredient.name())
                        .set(Tables.INGREDIENT.DESCRIPTION, newIngredient.description())
                        .returning()
                        .fetchOne(),
                "Ingredient was not created"
        ).into(Ingredient.class);
    }
}
