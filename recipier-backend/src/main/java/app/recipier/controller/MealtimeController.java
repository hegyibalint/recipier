package app.recipier.controller;

import app.recipier.db.Tables;
import app.recipier.domain.Mealtime;
import io.micronaut.http.annotation.Controller;
import io.micronaut.http.annotation.Get;
import org.jooq.DSLContext;

import java.util.List;

@Controller("mealtimes")
public class MealtimeController {

    private final DSLContext dsl;

    public MealtimeController(DSLContext dsl) {
        this.dsl = dsl;
    }


    @Get()
    public List<Mealtime> getAll() {
        return dsl.selectFrom(Tables.MEALTIME).fetchInto(Mealtime.class);
    }

}
