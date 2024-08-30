package app.recipier.controller;

import app.recipier.db.Tables;
import app.recipier.domain.Meal;
import app.recipier.domain.request.NewMeal;
import io.micronaut.http.HttpResponse;
import io.micronaut.http.annotation.*;
import org.jooq.DSLContext;

import java.time.LocalDate;
import java.util.List;
import java.util.Objects;

@Controller("meals")
public class MealController {

    private final DSLContext dsl;

    public MealController(DSLContext dsl) {
        this.dsl = dsl;
    }

    @Get()
    public List<Meal> getAll(@QueryValue LocalDate from, @QueryValue LocalDate to) {
        return dsl.select(
                        Tables.MEAL.ID,
                        Tables.RECIPE.NAME
                )
                .from(Tables.MEAL)
                .leftJoin(Tables.RECIPE)
                .onKey(Tables.MEAL.RECIPE_ID)
                .where(
                        Tables.MEAL.DATE.greaterOrEqual(from),
                        Tables.MEAL.DATE.lessOrEqual(to)
                ).fetch((record) -> new Meal(
                                record.get(Tables.MEAL.ID),
                                record.get(Tables.RECIPE.NAME)
                        )
                );
    }

    @Delete("/{id}")
    public HttpResponse<Void> delete(@PathVariable int id) {
        var deletedCount = dsl.deleteFrom(Tables.MEAL)
                .where(Tables.MEAL.ID.eq(id))
                .execute();
        return switch (deletedCount) {
            case 0 -> HttpResponse.notModified();
            case 1 -> HttpResponse.noContent();
            default -> HttpResponse.serverError();
        };
    }

    @Post()
    public int create(@Body NewMeal newMealRequest) {
        return Objects.requireNonNull(dsl.insertInto(Tables.MEAL)
                .set(Tables.MEAL.DATE, newMealRequest.date())
                .set(Tables.MEAL.MEALTIME_ID, newMealRequest.mealtimeId())
                .set(Tables.MEAL.RECIPE_ID, newMealRequest.recipeId())
                .returning(Tables.MEAL.ID)
                .fetchOne()
        ).getId();

    }

}
