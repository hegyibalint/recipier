package app.recipier.repository;

import app.recipier.domain.response.UnitDtoResponse;
import jakarta.inject.Singleton;
import org.jooq.DSLContext;

import java.util.List;

import static app.recipier.db.Tables.UNIT;

@Singleton
public class UnitRepository {

    private final DSLContext dsl;

    public UnitRepository(DSLContext dsl) {
        this.dsl = dsl;
    }

    public List<UnitDtoResponse> getAll() {
        return dsl.selectFrom(UNIT)
                .fetchInto(UnitDtoResponse.class);
    }

}
