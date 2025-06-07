package app.recipier.dto.unit;

public record GetUnit(
        Long id,
        GetUnitType type,
        String name,
        String abbreviation,
        String description
) {
}
