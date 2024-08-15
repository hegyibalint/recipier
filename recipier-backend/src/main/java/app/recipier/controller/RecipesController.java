package app.recipier.controller;

import app.recipier.domain.Recipe;
import app.recipier.domain.RecipeWithDetails;
import app.recipier.domain.request.NewRecipe;
import app.recipier.repository.RecipeIngredientRepository;
import app.recipier.repository.RecipeRepository;
import app.recipier.repository.RecipeStepRepository;
import io.micronaut.http.annotation.*;
import org.jooq.DSLContext;

import java.util.List;

@Controller("/recipes")
public class RecipesController {

    private final DSLContext dsl;
    private final RecipeRepository recipeRepository;
    private final RecipeIngredientRepository recipeIngredientRepository;
    private final RecipeStepRepository recipeStepRepository;

    public RecipesController(DSLContext dsl, RecipeRepository recipeRepository, RecipeIngredientRepository recipeIngredientRepository, RecipeStepRepository recipeStepRepository) {
        this.dsl = dsl;
        this.recipeIngredientRepository = recipeIngredientRepository;
        this.recipeStepRepository = recipeStepRepository;
        this.recipeRepository = recipeRepository;
    }

    @Get
    public List<Recipe> getAll() {
        return recipeRepository.getAll();
    }

    @Get("/{id}")
    public RecipeWithDetails get(@PathVariable int id) {
        return recipeRepository.getForId(id);
    }

    @Post()
    public Recipe create(@Body NewRecipe newRecipeRequest) {
        var recipe = recipeRepository.create(newRecipeRequest);
        newRecipeRequest.ingredients().forEach(newRecipeIngredient ->
                recipeIngredientRepository.create(newRecipeIngredient, recipe.id())
        );
        newRecipeRequest.steps().forEach(newRecipeStep ->
                recipeStepRepository.create(recipe.id(), newRecipeStep)
        );
        return recipe;
    }

}
