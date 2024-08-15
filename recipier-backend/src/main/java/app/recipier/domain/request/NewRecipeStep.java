package app.recipier.domain.request;

import io.micronaut.serde.annotation.Serdeable;
import jakarta.validation.constraints.NotEmpty;

@Serdeable
public record NewRecipeStep(@NotEmpty String step) {
}
