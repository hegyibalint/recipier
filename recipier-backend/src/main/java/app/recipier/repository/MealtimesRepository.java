package app.recipier.repository;

import app.recipier.db.Tables;
import app.recipier.domain.Mealtime;
import jakarta.inject.Singleton;
import org.jooq.DSLContext;

import java.util.List;

@Singleton
public class MealtimesRepository {

    DSLContext dsl;

    public MealtimesRepository(DSLContext dsl) {
        this.dsl = dsl;
    }

    public List<Mealtime> getAll() {
        return dsl.selectFrom(Tables.MEALTIME).fetchInto(Mealtime.class);
    }
}
