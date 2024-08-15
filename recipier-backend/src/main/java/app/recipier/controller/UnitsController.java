package app.recipier.controller;

import app.recipier.domain.Unit;
import app.recipier.domain.request.NewUnit;
import app.recipier.repository.UnitRepository;
import io.micronaut.http.annotation.Body;
import io.micronaut.http.annotation.Controller;
import io.micronaut.http.annotation.Get;
import io.micronaut.http.annotation.Post;

import java.util.List;

@Controller("units")
public class UnitsController {

    private final UnitRepository unitRepository;

    public UnitsController(UnitRepository unitRepository) {
        this.unitRepository = unitRepository;
    }

    @Get()
    public List<Unit> getAll() {
        return unitRepository.getAll();
    }

    @Post()
    public Unit create(@Body NewUnit unit) {
        return unitRepository.create(unit);
    }

}
