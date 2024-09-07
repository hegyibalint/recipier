package app.recipier.endpoint;

import app.recipier.domain.Ingredient;
import io.micronaut.http.HttpResponse;
import io.micronaut.http.annotation.Controller;
import io.micronaut.http.annotation.Get;
import io.micronaut.http.annotation.Post;
import org.jdbi.v3.core.Jdbi;

import java.util.List;

@Controller("/ingredients")
public class IngredientsEndpoint {

    private final Jdbi jdbi;

    public IngredientsEndpoint(Jdbi jdbi) {
        this.jdbi = jdbi;
    }

    @Get
    public List<Ingredient> getAll() {
        return jdbi.withHandle(handle -> handle
                .createQuery("""
                        SELECT * FROM ingredient
                        ORDER BY id
                        """)
                .mapTo(Ingredient.class)
                .list()
        );
    }

    @Get("/{id}")
    public HttpResponse<Ingredient> get(int id) {
        return jdbi.withHandle(handle -> handle
                .createQuery("""
                        SELECT * FROM ingredient
                        WHERE id = :id
                        """)
                .bind("id", id)
                .mapTo(Ingredient.class)
                .findOne()
                .map(HttpResponse::ok)
                .orElse(HttpResponse.notFound())
        );
    }

    @Post
    public Ingredient create(Ingredient ingredient) {
        var id = jdbi.withHandle(handle -> handle
                .createUpdate("""
                        INSERT INTO ingredient (name, description)
                        VALUES (:name, :description)
                        RETURNING id
                        """)
                .bindMethods(ingredient)
                .executeAndReturnGeneratedKeys()
                .mapTo(Integer.class)
                .one()
        );
        return new Ingredient(
                id,
                ingredient.name(),
                ingredient.description()
        );
    }

}
