package app.recipier.dto.unit;

public record GetUnit(
        Long id,
        GetUnitType type,
        String name,
        String abbrevation,
        String description
) {
}
