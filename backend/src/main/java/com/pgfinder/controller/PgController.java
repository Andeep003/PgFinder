package com.pgfinder.controller;

import com.pgfinder.dto.PgDtos.PgDetail;
import com.pgfinder.dto.PgDtos.PgSummary;
import com.pgfinder.service.PgService;
import com.pgfinder.service.PgService.SearchFilters;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Public PG endpoints (no login needed).
 *
 *   GET /api/pgs        search PGs   e.g. /api/pgs?lat=17.4486&lng=78.3908&radiusKm=10&gender=Boys
 *   GET /api/pgs/{id}   one PG with all rooms and beds
 */
@RestController
@RequestMapping("/api/pgs")
public class PgController {

    private final PgService pgService;

    public PgController(PgService pgService) {
        this.pgService = pgService;
    }

    @GetMapping
    public List<PgSummary> search(@RequestParam(required = false) Double lat,
                                  @RequestParam(required = false) Double lng,
                                  @RequestParam(required = false) Double radiusKm,
                                  @RequestParam(required = false) String gender,
                                  @RequestParam(required = false) Integer sharing,
                                  @RequestParam(required = false) Integer maxRent,
                                  @RequestParam(required = false) String sort,
                                  @RequestParam(required = false) String name) {
        return pgService.search(new SearchFilters(lat, lng, radiusKm, gender, sharing, maxRent, sort, name));
    }

    @GetMapping("/{id}")
    public PgDetail getById(@PathVariable String id) {
        return pgService.getById(id);
    }
}
