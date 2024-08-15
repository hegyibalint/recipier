package app.recipier.controller;

import app.recipier.domain.Ingredient;
import app.recipier.domain.request.NewIngredient;
import app.recipier.repository.IngredientsRepository;
import io.micronaut.http.annotation.Controller;
import io.micronaut.http.annotation.Get;

import java.util.List;

@Controller("/ingredients")
public class IngredientsController {

    private final IngredientsRepository ingredientsRepository;

    public IngredientsController(IngredientsRepository ingredientsRepository) {
        this.ingredientsRepository = ingredientsRepository;
    }

    @Get()
    public List<Ingredient> getAll() {
        return ingredientsRepository.getAll();
    }

    public Ingredient create(NewIngredient newIngredient) {
        return ingredientsRepository.create(newIngredient);
    }
}
