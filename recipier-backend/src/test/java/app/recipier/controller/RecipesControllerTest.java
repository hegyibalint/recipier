package app.recipier.controller;

import app.recipier.AbstractDatabaseTest;
import app.recipier.domain.UnitType;
import app.recipier.domain.request.NewIngredient;
import app.recipier.domain.request.NewRecipe;
import app.recipier.domain.request.NewRecipeIngredient;
import app.recipier.domain.request.NewUnit;
import app.recipier.repository.IngredientsRepository;
import app.recipier.repository.UnitRepository;
import io.micronaut.test.extensions.junit5.annotation.MicronautTest;
import jakarta.inject.Inject;
import org.jooq.DSLContext;
import org.junit.jupiter.api.Test;

import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@MicronautTest
class RecipesControllerTest extends AbstractDatabaseTest {

    @Inject
    DSLContext dslContext;

    @Inject
    RecipesController recipesController;

    @Inject
    UnitRepository unitRepository;

    @Inject
    IngredientsRepository ingredientsRepository;

    @Test
    void testGetAllRecipes() {
        assertNotNull(recipesController.getAll());
    }

    @Test
    void createRecipe() {
        var testUnit = unitRepository.create(
                new NewUnit(UnitType.QUANTITY, "test", "t", "Test unit description")
        );

        var testIngredient = ingredientsRepository.create(
                new NewIngredient("Apple", "Test ingredient description")
        );

        var newRecipe = new NewRecipe(
                "Test Recipe",
                "Test Description",
                List.of(
                        new NewRecipeIngredient(testIngredient.id(), testUnit.id(), 1.0f, "First ingredient description")
                ),
                Collections.emptyList()
        );

        var recipe = recipesController.create(newRecipe);
        assertNotNull(recipe);
        assertEquals(recipe.name(), newRecipe.name());
        assertEquals(recipe.description(), newRecipe.description());
    }

}