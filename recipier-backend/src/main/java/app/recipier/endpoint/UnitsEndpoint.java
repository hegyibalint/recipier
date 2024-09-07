package app.recipier.endpoint;

import app.recipier.domain.Unit;
import app.recipier.domain.request.NewUnit;
import app.recipier.jdbi.RowMappers;
import io.micronaut.http.HttpResponse;
import io.micronaut.http.annotation.*;
import org.jdbi.v3.core.Jdbi;

import java.util.List;

@Controller("/units")
public class UnitsEndpoint {

    private final Jdbi jdbi;

    public UnitsEndpoint(Jdbi jdbi) {
        this.jdbi = jdbi;
    }

    @Get()
    public List<Unit> getAll() {
        return jdbi.withHandle(handle -> handle
                .createQuery("""
                        SELECT * FROM unit
                        ORDER BY id
                        """)
                .map(RowMappers.getUnitMapper())
                .list()
        );
    }

    @Get("/{id}")
    public HttpResponse<Unit> get(int id) {
        return jdbi.withHandle(handle -> handle
                .createQuery("""
                        SELECT * FROM unit
                        WHERE id = :id
                        """)
                .bind("id", id)
                .map(RowMappers.getUnitMapper())
                .findOne()
                .map(HttpResponse::ok)
                .orElse(HttpResponse.notFound())
        );
    }

    @Post()
    public Unit create(@Body NewUnit unit) {
        var id = jdbi.withHandle(handle -> handle
                .createUpdate("""
                        INSERT INTO unit (type, name, abbreviation, description)
                        VALUES (CAST(:type AS unit_type), :name, :abbreviation, :description)
                        RETURNING id
                        """)
                .bindMethods(unit)
                .executeAndReturnGeneratedKeys()
                .mapTo(Integer.class)
                .one()
        );
        return new Unit(
                id,
                unit.type(),
                unit.name(),
                unit.abbreviation(),
                unit.description()
        );
    }

}
