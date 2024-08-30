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
        return
    }

    public int delete(int id) {
        return
    }

    public int create(NewMeal newMealRequest) {
        return
    }
}
