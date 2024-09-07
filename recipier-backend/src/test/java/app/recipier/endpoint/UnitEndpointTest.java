package app.recipier.endpoint;

import app.recipier.AbstractE2ETest;
import app.recipier.domain.UnitType;
import app.recipier.domain.request.NewUnit;
import io.micronaut.test.extensions.junit5.annotation.MicronautTest;
import org.hamcrest.Matcher;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

@MicronautTest
public class UnitEndpointTest extends AbstractE2ETest {

    private static final NewUnit NEW_TEST_UNIT = new NewUnit(
            UnitType.WEIGHT,
            "kilogram",
            "kg",
            "A kilogram is a unit of mass."
    );

    @Test
    @DisplayName("Create a single unit")
    void testCreateUnit() {
        given()
                .contentType("application/json")
                .body(NEW_TEST_UNIT)
                .when()
                .post("/units")
                .then()
                .statusCode(200)
                .body("id", notNullValue())
                .body("$", unitJsonMatcher(NEW_TEST_UNIT));
    }

    @Test
    @DisplayName("Get all units from empty database")
    void testGetAllEmpty() {
        given()
                .when()
                .get("/units")
                .then()
                .statusCode(200)
                .body("size()", equalTo(0));
    }

    @Test
    @DisplayName("Creating a unit will be present in the list of all units")
    void testCreateAndGetAll() {
        given()
                .contentType("application/json")
                .body(NEW_TEST_UNIT)
                .when()
                .post("/units")
                .then()
                .statusCode(200);

        given()
                .when()
                .get("/units")
                .then()
                .statusCode(200)
                .body("size()", equalTo(1))
                .body("[0].id", notNullValue())
                .body("[0]", unitJsonMatcher(NEW_TEST_UNIT));
    }

    @Test
    @DisplayName("Creating a unit and getting it by id will return the same unit")
    void testCreateAndGetById() {
        var id = given()
                .contentType("application/json")
                .body(NEW_TEST_UNIT)
                .when()
                .post("/units")
                .then()
                .statusCode(200)
                .extract()
                .path("id");

        given()
                .when()
                .get("/units/{id}", id)
                .then()
                .statusCode(200)
                .body("id", equalTo(id))
                .body("$", unitJsonMatcher(NEW_TEST_UNIT));
    }

    @Test
    @DisplayName("Get a non-existing unit")
    void testGetNonExistingUnit() {
        given()
                .when()
                .get("/units/1")
                .then()
                .statusCode(404);
    }

    @Test
    @DisplayName("Cannot create a unit with the same name")
    void testCreateDuplicateUnit() {
        given()
                .contentType("application/json")
                .body(NEW_TEST_UNIT)
                .when()
                .post("/units")
                .then()
                .statusCode(200);

        given()
                .contentType("application/json")
                .body(NEW_TEST_UNIT)
                .when()
                .post("/units")
                .then()
                .statusCode(400);
    }

    public static Matcher<?> unitJsonMatcher(NewUnit unit) {
        return allOf(
                hasEntry("type", unit.type().toString()),
                hasEntry("name", unit.name()),
                hasEntry("abbreviation", unit.abbreviation()),
                hasEntry("description", unit.description())
        );
    }
}
