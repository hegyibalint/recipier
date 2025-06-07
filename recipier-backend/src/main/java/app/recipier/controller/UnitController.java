package app.recipier.controller;

import app.recipier.dto.unit.PostUnit;
import app.recipier.dto.unit.PutUnit;
import app.recipier.dto.unit.GetUnit;
import app.recipier.dto.unit.GetUnitType;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import org.jdbi.v3.core.Jdbi;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;

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
    @Operation(summary = "Get unit by ID")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Unit found"),
        @ApiResponse(responseCode = "404", description = "Unit not found")
    })
    public ResponseEntity<GetUnit> getUnit(@PathVariable Long id) {
        return jdbi.inTransaction(handle -> {
            var result = handle
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
                    .findOne();
            
            return result.map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        });
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update unit by ID")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Unit updated successfully"),
        @ApiResponse(responseCode = "404", description = "Unit not found")
    })
    public ResponseEntity<GetUnit> putUnit(@PathVariable Long id, @RequestBody PutUnit unit) {
        return jdbi.inTransaction(handle -> {
            int updatedRows = handle.createUpdate("""
                            UPDATE unit SET 
                                type = CAST(:type AS unit_type),
                                name = :name,
                                abbreviation = :abbreviation,
                                description = :description
                            WHERE id = :id
                            """)
                    .bind("id", id)
                    .bind("type", unit.type())
                    .bind("name", unit.name())
                    .bind("abbreviation", unit.abbreviation())
                    .bind("description", unit.description())
                    .execute();
            
            if (updatedRows == 0) {
                return ResponseEntity.notFound().build();
            }
            
            var result = handle
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
                    .one();
            
            return ResponseEntity.ok(result);
        });
    }

}
