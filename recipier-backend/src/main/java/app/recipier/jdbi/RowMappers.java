package app.recipier.jdbi;

import app.recipier.domain.Unit;
import app.recipier.domain.UnitType;
import org.jdbi.v3.core.mapper.RowMapper;

public class RowMappers {

    public static RowMapper<Unit> getUnitMapper() {
        return (rs, ctx) -> new Unit(
                rs.getInt("id"),
                UnitType.valueOf(rs.getString("type")),
                rs.getString("name"),
                rs.getString("abbreviation"),
                rs.getString("description")
        );
    }

}
