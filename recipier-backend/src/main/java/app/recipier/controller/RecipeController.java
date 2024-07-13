package app.recipier.controller;

import app.recipier.domain.request.CreateRecipeRequest;
import app.recipier.repository.RecipeRepository;
import io.micronaut.http.annotation.Controller;
import io.micronaut.http.annotation.Post;

@Controller("recipe")
public class RecipeController {

    private final RecipeRepository recipeRepository;

    public RecipeController(RecipeRepository recipeRepository) {
        this.recipeRepository = recipeRepository;
    }

    @Post("create")
    public long createNewRecipe(CreateRecipeRequest createRecipeRequest) {
        return recipeRepository.create(createRecipeRequest);
    }

}
