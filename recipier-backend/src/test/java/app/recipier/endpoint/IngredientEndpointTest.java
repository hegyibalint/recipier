package app.recipier.endpoint;

import app.recipier.AbstractE2ETest;
import app.recipier.domain.request.NewIngredient;
import app.recipier.domain.request.NewUnit;
import io.micronaut.test.extensions.junit5.annotation.MicronautTest;
import org.hamcrest.Matcher;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

@MicronautTest
public class IngredientEndpointTest extends AbstractE2ETest {

    private static final NewIngredient NEW_TEST_INGREDIENT = new NewIngredient(
            "Ingredient",
            "A test ingredient"
    );

    @Test
    @DisplayName("Create a single unit")
    void testCreateIngredient() {
        given()
                .contentType("application/json")
                .body(NEW_TEST_INGREDIENT)
                .when()
                .post("/ingredients")
                .then()
                .statusCode(200)
                .body("id", notNullValue())
                .body("$", ingredientIs(NEW_TEST_INGREDIENT));
    }

    @Test
    @DisplayName("Get all ingredients from empty database")
    void testGetAllEmpty() {
        given()
                .when()
                .get("/ingredients")
                .then()
                .statusCode(200)
                .body("size()", equalTo(0));
    }

    @Test
    @DisplayName("Creating an ingredient will be present in the list of all ingredients")
    void testCreateAndGetAll() {
        given()
                .contentType("application/json")
                .body(NEW_TEST_INGREDIENT)
                .when()
                .post("/ingredients")
                .then()
                .statusCode(200);

        given()
                .when()
                .get("/ingredients")
                .then()
                .statusCode(200)
                .body("size()", equalTo(1))
                .body("[0]", ingredientIs(NEW_TEST_INGREDIENT));
    }

    @Test
    @DisplayName("Get a single ingredient")
    void testGetSingle() {
        var id = given()
                .contentType("application/json")
                .body(NEW_TEST_INGREDIENT)
                .when()
                .post("/ingredients")
                .then()
                .statusCode(200)
                .extract()
                .path("id");

        given()
                .when()
                .get("/ingredients/{id}", id)
                .then()
                .statusCode(200)
                .body("$", ingredientIs(NEW_TEST_INGREDIENT));
    }

    @Test
    @DisplayName("Get a single ingredient that does not exist")
    void testGetSingleNotFound() {
        given()
                .when()
                .get("/ingredients/{id}", 1)
                .then()
                .statusCode(404);
    }

    public static Matcher<?> ingredientIs(NewIngredient ingredient) {
        return allOf(
                hasEntry("name", ingredient.name()),
                hasEntry("description", ingredient.description())
        );
    }
}
