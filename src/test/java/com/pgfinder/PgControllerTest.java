package com.pgfinder;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Runs against the in-memory H2 database ("dev" profile) filled by DataSeeder. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
class PgControllerTest {

    @Autowired
    private MockMvc mvc;

    @Test
    void listsOnlyApprovedPgs() throws Exception {
        mvc.perform(get("/api/pgs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(11)))
                .andExpect(jsonPath("$[*].name", not(hasItem("BTM Budget Stay"))));
    }

    @Test
    void searchesNearbySortedByDistance() throws Exception {
        mvc.perform(get("/api/pgs").param("lat", "17.4486").param("lng", "78.3908").param("radiusKm", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(7)))
                .andExpect(jsonPath("$[0].id").value("pg-1"))
                .andExpect(jsonPath("$[*].distanceKm", everyItem(lessThanOrEqualTo(10.0))));
    }

    @Test
    void filtersByGender() throws Exception {
        mvc.perform(get("/api/pgs").param("gender", "Girls"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(3)))
                .andExpect(jsonPath("$[*].gender", everyItem(is("Girls"))));
    }

    @Test
    void returnsPgWithRoomsAndBeds() throws Exception {
        mvc.perform(get("/api/pgs/pg-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Sri Sai Comfort PG"))
                .andExpect(jsonPath("$.rooms", hasSize(9)))
                .andExpect(jsonPath("$.stats.totalBeds").value(24))
                .andExpect(jsonPath("$.foodMenu.Monday.breakfast").value("Idli, Sambar, Chutney"));
    }

    @Test
    void unknownPgReturns404() throws Exception {
        mvc.perform(get("/api/pgs/pg-999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("PG not found: pg-999"));
    }
}
