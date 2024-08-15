package app.recipier.domain;

import io.micronaut.serde.annotation.Serdeable;

@Serdeable
public enum UnitType {
    VOLUME, WEIGHT, QUANTITY
}
