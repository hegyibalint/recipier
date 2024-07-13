package app.recipier.domain.response;

import io.micronaut.serde.annotation.Serdeable;

@Serdeable
public record UnitDtoResponse(int id, String name, String abbrevation) {}
