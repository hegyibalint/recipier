package app.recipier.repository;

import app.recipier.domain.Unit;
import app.recipier.domain.request.NewUnit;
import jakarta.inject.Singleton;
import org.jooq.DSLContext;
import org.jooq.exception.IntegrityConstraintViolationException;

import java.util.List;
import java.util.Objects;

import static app.recipier.db.Tables.UNIT;

@Singleton
public class UnitRepository {

    private final DSLContext dsl;

    public UnitRepository(DSLContext dsl) {
        this.dsl = dsl;
    }

    public List<Unit> getAll() {
        return dsl.selectFrom(UNIT)
                .fetchInto(Unit.class);
    }

    public Unit create(NewUnit unit) throws IntegrityConstraintViolationException {
        return Objects.requireNonNull(
                dsl.insertInto(UNIT)
                        .set(dsl.newRecord(UNIT, unit))
                        .returning()
                        .fetchOne(),
                "Unit was not created"
        ).into(Unit.class);
    }
}
