package app.recipier.repository;

import app.recipier.db.Tables;
import app.recipier.domain.Meal;
import app.recipier.domain.request.NewMeal;
import jakarta.inject.Singleton;
import org.jooq.DSLContext;

import java.time.LocalDate;
import java.util.List;
import java.util.Objects;

@Singleton
public class MealRepository {

    private final DSLContext dsl;

    public MealRepository(DSLContext dsl) {
        this.dsl = dsl;
    }

    public List<Meal> getAllBetween(LocalDate from, LocalDate to) {
        return dsl.select(
                        Tables.MEAL.ID,
                        Tables.RECIPE.NAME
                )
                .from (Tables.MEAL)
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

    public int delete(int id) {
        return dsl.deleteFrom(Tables.MEAL)
                .where(Tables.MEAL.ID.eq(id))
                .execute();
    }

    public int create(NewMeal newMealRequest) {
        return Objects.requireNonNull(dsl.insertInto(Tables.MEAL)
                                .set(Tables.MEAL.DATE, newMealRequest.date())
                                .set(Tables.MEAL.MEALTIME_ID, newMealRequest.mealtimeId())
                                .set(Tables.MEAL.RECIPE_ID, newMealRequest.recipeId())
                                .returning(Tables.MEAL.ID)
                                .fetchOne(),
                        "Meal was not created")
                .getId();
    }
}
