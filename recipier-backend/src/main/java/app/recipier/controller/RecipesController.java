package app.recipier.controller;

import app.recipier.domain.request.CreateRecipeRequest;
import app.recipier.repository.RecipeRepository;
import io.micronaut.http.annotation.Controller;
import io.micronaut.http.annotation.Post;

@Controller("/recipes")
public class RecipesController {

    private final RecipeRepository recipeRepository;

    public RecipesController(RecipeRepository recipeRepository) {
        this.recipeRepository = recipeRepository;
    }

    @Post()
    public long createNewRecipe(CreateRecipeRequest createRecipeRequest) {
        return recipeRepository.create(createRecipeRequest);
    }

}
