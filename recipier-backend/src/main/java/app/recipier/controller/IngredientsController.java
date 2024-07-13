package app.recipier.controller;

import app.recipier.domain.model.Ingredient;
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

    @Get("/like/{name}")
    public List<Ingredient> getIngredientsLike(String name) {
        var like = ingredientsRepository.getLike(name);
        return like;
    }

}
