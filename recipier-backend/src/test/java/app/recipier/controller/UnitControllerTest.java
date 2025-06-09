package app.recipier.controller;

import app.recipier.AbstractDatabaseTest;
import app.recipier.dto.unit.PostUnit;
import app.recipier.dto.unit.PostUnitType;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.*;
import static org.hamcrest.Matchers.hasSize;

public class UnitControllerTest extends AbstractDatabaseTest {

    @Test
    void getUnits_shouldReturnEmptyListWhenNoUnits() {
        given()
                .when()
                .get("/unit")
                .then()
                .statusCode(200)
                .body("$", hasSize(0));
    }

    @Test
    void postUnit_shouldCreateAndReturnUnit() {
        PostUnit newUnit = new PostUnit(
                PostUnitType.VOLUME,
                "Liter",
                "L",
                "A unit of volume"
        );

        given()
                .contentType(ContentType.JSON)
                .body(newUnit)
                .when()
                .post("/unit")
                .then()
                .statusCode(200)
                .body("$", hasSize(1))
                .body("[0].id", notNullValue())
                .body("[0].type", equalTo("VOLUME"))
                .body("[0].name", equalTo("Liter"))
                .body("[0].abbreviation", equalTo("L"))
                .body("[0].description", equalTo("A unit of volume"));
    }

    @Test
    void getUnits_shouldReturnAllUnits() {
        PostUnit unit1 = new PostUnit(PostUnitType.VOLUME, "Liter", "L", "Volume unit");
        PostUnit unit2 = new PostUnit(PostUnitType.WEIGHT, "Kilogram", "kg", "Weight unit");

        given().contentType(ContentType.JSON).body(unit1).post("/unit");
        given().contentType(ContentType.JSON).body(unit2).post("/unit");

        given()
                .when()
                .get("/unit")
                .then()
                .statusCode(200)
                .body("$", hasSize(2))
                .body("[0].name", equalTo("Liter"))
                .body("[1].name", equalTo("Kilogram"));
    }

    @Test
    void getUnit_shouldReturnSpecificUnit() {
        PostUnit newUnit = new PostUnit(
                PostUnitType.QUANTITY,
                "Piece",
                "pcs",
                "A quantity unit"
        );

        Integer unitId = given()
                .contentType(ContentType.JSON)
                .body(newUnit)
                .post("/unit")
                .then()
                .extract()
                .path("[0].id");

        given()
                .pathParam("id", unitId)
                .when()
                .get("/unit/{id}")
                .then()
                .statusCode(200)
                .body("id", equalTo(unitId))
                .body("type", equalTo("QUANTITY"))
                .body("name", equalTo("Piece"))
                .body("abbreviation", equalTo("pcs"))
                .body("description", equalTo("A quantity unit"));
    }

    @Test
    void getUnit_shouldReturn404ForNonExistentUnit() {
        given()
                .pathParam("id", 999L)
                .when()
                .get("/unit/{id}")
                .then()
                .statusCode(404);
    }

    @Test
    void postUnit_shouldPreventDuplicateNames() {
        PostUnit unit1 = new PostUnit(PostUnitType.VOLUME, "Liter", "L", "First liter");
        PostUnit unit2 = new PostUnit(PostUnitType.VOLUME, "Liter", "l", "Second liter");

        given().contentType(ContentType.JSON).body(unit1).post("/unit");

        given()
                .contentType(ContentType.JSON)
                .body(unit2)
                .when()
                .post("/unit")
                .then()
                .statusCode(500);
    }

    @Test
    void postUnit_shouldPreventDuplicateAbbreviations() {
        PostUnit unit1 = new PostUnit(PostUnitType.VOLUME, "Liter", "L", "First unit");
        PostUnit unit2 = new PostUnit(PostUnitType.WEIGHT, "Pound", "L", "Second unit");

        given().contentType(ContentType.JSON).body(unit1).post("/unit");

        given()
                .contentType(ContentType.JSON)
                .body(unit2)
                .when()
                .post("/unit")
                .then()
                .statusCode(500);
    }
}