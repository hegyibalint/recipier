package app.recipier.controller;

import app.recipier.domain.Meal;
import app.recipier.domain.request.NewMeal;
import app.recipier.repository.MealRepository;
import io.micronaut.http.HttpResponse;
import io.micronaut.http.annotation.*;

import java.time.LocalDate;
import java.util.List;

@Controller("meals")
public class MealController {

    private final MealRepository mealRepository;

    public MealController(MealRepository mealRepository) {
        this.mealRepository = mealRepository;
    }

    @Get()
    public List<Meal> getAllBetween(@QueryValue LocalDate from, @QueryValue LocalDate to) {
        return mealRepository.getAllBetween(from, to);
    }

    @Delete("/{id}")
    public HttpResponse<Void> delete(@PathVariable int id) {
        var deletedCount = mealRepository.delete(id);
        return switch (deletedCount) {
            case 0 -> HttpResponse.notModified();
            case 1 -> HttpResponse.noContent();
            default -> HttpResponse.serverError();
        };
    }

    @Post()
    public int create(@Body NewMeal newMealRequest) {
        // Parse day to LocalDate
        return mealRepository.create(newMealRequest);
    }

}
