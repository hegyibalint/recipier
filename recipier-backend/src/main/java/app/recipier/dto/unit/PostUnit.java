package app.recipier.dto.unit;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

public record PostUnit(
        @NotNull
        PostUnitType type,
        @NotEmpty
        String name,
        @NotBlank
        String abbreviation,
        @NotBlank
        String description
) {
}
