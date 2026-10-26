package com.pgfinder.service;

import com.pgfinder.dto.PgDtos.PgDetail;
import com.pgfinder.dto.PgDtos.PgSummary;
import com.pgfinder.exception.NotFoundException;
import com.pgfinder.model.Pg;
import com.pgfinder.repository.PgRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

/** Business logic for PGs. Controllers stay thin and call into here. */
@Service
public class PgService {

    private final PgRepository pgRepository;

    public PgService(PgRepository pgRepository) {
        this.pgRepository = pgRepository;
    }

    /** Search filters, all optional. Mirrors the filters on the Home page. */
    public record SearchFilters(Double lat, Double lng, Double radiusKm, String gender, Integer sharing,
                                Integer maxRent, String sort) {
    }

    @Transactional(readOnly = true)
    public List<PgSummary> search(SearchFilters f) {
        boolean hasLocation = f.lat() != null && f.lng() != null;

        Comparator<PgSummary> order = switch (f.sort() == null ? "distance" : f.sort()) {
            case "price" -> Comparator.comparingInt(s -> s.stats().minRent());
            case "name" -> Comparator.comparing(PgSummary::name);
            default -> hasLocation
                    ? Comparator.comparingDouble(PgSummary::distanceKm)
                    : Comparator.comparing(PgSummary::name);
        };

        return pgRepository.findByStatus("approved").stream()
                .filter(pg -> f.gender() == null || f.gender().equalsIgnoreCase(pg.getGender()))
                .filter(pg -> f.sharing() == null || hasFreeBedWithSharing(pg, f.sharing()))
                .map(pg -> PgSummary.from(pg, hasLocation ? round1(distanceKm(f.lat(), f.lng(), pg.getLat(), pg.getLng())) : null))
                .filter(s -> f.maxRent() == null || s.stats().minRent() <= f.maxRent())
                .filter(s -> !hasLocation || f.radiusKm() == null || s.distanceKm() <= f.radiusKm())
                .sorted(order)
                .toList();
    }

    @Transactional(readOnly = true)
    public PgDetail getById(String id) {
        Pg pg = pgRepository.findById(id).orElseThrow(() -> new NotFoundException("PG not found: " + id));
        if (!"approved".equals(pg.getStatus())) {
            throw new NotFoundException("PG not found: " + id);
        }
        return PgDetail.from(pg);
    }

    private static boolean hasFreeBedWithSharing(Pg pg, int sharing) {
        return pg.getRooms().stream().anyMatch(r -> r.getSharing() == sharing
                && r.getBeds().stream().anyMatch(b -> "available".equals(b.getStatus())));
    }

    /** Haversine distance, same formula as distanceKm() in the frontend's utils/geo.js. */
    static double distanceKm(double lat1, double lng1, double lat2, double lng2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double h = Math.pow(Math.sin(dLat / 2), 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) * Math.pow(Math.sin(dLng / 2), 2);
        return 2 * 6371 * Math.asin(Math.sqrt(h));
    }

    private static double round1(double v) {
        return Math.round(v * 10) / 10.0;
    }
}
