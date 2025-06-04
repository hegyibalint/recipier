package app.recipier.controller;

import app.recipier.dto.unit.PostUnit;
import app.recipier.dto.unit.GetUnit;
import app.recipier.dto.unit.GetUnitType;
import org.jdbi.v3.core.Jdbi;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/unit")
public class UnitController {

    private final Jdbi jdbi;

    @Autowired
    public UnitController(Jdbi jdbi) {
        this.jdbi = jdbi;
    }

    @GetMapping
    public List<GetUnit> getUnits() {
        return jdbi.inTransaction(handle -> handle
                .createQuery("""
                        SELECT id, type, name, abbreviation, description
                        FROM unit
                        """)
                .map((row, ctx) ->
                        new GetUnit(
                                row.getLong("id"),
                                GetUnitType.valueOf(row.getString("type")),
                                row.getString("name"),
                                row.getString("abbreviation"),
                                row.getString("description")
                        )
                )
                .list()
        );
    }

    @PostMapping
    public List<GetUnit> postUnit(@RequestBody PostUnit unit) {
        return jdbi.inTransaction(handle -> {
            handle.createUpdate("""
                            INSERT INTO unit(type, name, abbreviation, description)
                            VALUES (
                                CAST(:type AS unit_type),
                                :name,
                                :abbreviation, 
                                :description
                            )
                            RETURNING id""")
                    .bind("type", unit.type())
                    .bind("name", unit.name())
                    .bind("abbreviation", unit.abbreviation())
                    .bind("description", unit.description())
                    .executeAndReturnGeneratedKeys("id")
                    .mapTo(Long.class)
                    .one();
            return getUnits();
        });
    }

    @GetMapping("/{id}")
    public GetUnit getUnit(@PathVariable Long id) {
        return jdbi.inTransaction(handle -> handle
                .createQuery("""
                        SELECT id, type, name, abbreviation, description
                        FROM unit
                        WHERE id = :id
                        """)
                .bind("id", id)
                .map((row, ctx) ->
                        new GetUnit(
                                row.getLong("id"),
                                GetUnitType.valueOf(row.getString("type")),
                                row.getString("name"),
                                row.getString("abbreviation"),
                                row.getString("description")
                        )
                )
                .one()
        );
    }

}
