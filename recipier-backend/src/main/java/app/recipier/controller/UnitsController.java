package app.recipier.controller;

import app.recipier.domain.Unit;
import app.recipier.domain.request.NewUnit;
import app.recipier.repository.UnitRepository;
import io.micronaut.http.annotation.Body;
import io.micronaut.http.annotation.Controller;
import io.micronaut.http.annotation.Get;
import io.micronaut.http.annotation.Post;
import org.jooq.DSLContext;

import java.util.List;
import java.util.Objects;

import static app.recipier.db.Tables.UNIT;

@Controller("units")
public class UnitsController {

    private final DSLContext dsl;

    public UnitsController(DSLContext dsl) {
        this.dsl = dsl;
    }

    @Get()
    public List<Unit> getAll() {
        return dsl.selectFrom(UNIT).fetchInto(Unit.class)
    }

    @Post()
    public Unit create(@Body NewUnit unit) {
        return Objects.requireNonNull(
                dsl.insertInto(UNIT)
                        .set(dsl.newRecord(UNIT, unit))
                        .returning()
                        .fetchOne(),
                "Unit was not created"
        ).into(Unit.class);
    }

}
