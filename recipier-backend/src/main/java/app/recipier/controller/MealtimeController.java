package app.recipier.controller;

import app.recipier.domain.Mealtime;
import app.recipier.repository.MealtimesRepository;
import io.micronaut.http.annotation.Controller;
import io.micronaut.http.annotation.Get;

import java.util.List;

@Controller("mealtimes")
public class MealtimeController {

    MealtimesRepository mealtimesRepository;

    public MealtimeController(MealtimesRepository mealtimesRepository) {
        this.mealtimesRepository = mealtimesRepository;
    }


    @Get()
    public List<Mealtime> getAll() {
        return mealtimesRepository.getAll();
    }

}
