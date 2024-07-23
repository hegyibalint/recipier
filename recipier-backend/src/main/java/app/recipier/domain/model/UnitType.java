package app.recipier.domain.model;

import io.micronaut.serde.annotation.Serdeable;

@Serdeable
public enum UnitType {
    VOLUME,
    WEIGHT,
    QUANTITY
}
