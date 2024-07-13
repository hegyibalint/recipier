package app.recipier.controller;

import app.recipier.domain.response.UnitDtoResponse;
import app.recipier.repository.UnitRepository;
import io.micronaut.http.annotation.Controller;
import io.micronaut.http.annotation.Get;

import java.util.List;

@Controller("units")
public class UnitsController {

    private final UnitRepository unitRepository;

    public UnitsController(UnitRepository unitRepository) {
        this.unitRepository = unitRepository;
    }

    @Get()
    public List<UnitDtoResponse> getAll() {
        return unitRepository.getAll();
    }

}
