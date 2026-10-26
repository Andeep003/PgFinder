package com.pgfinder;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pgfinder.model.Bed;
import com.pgfinder.repository.PgRepository;
import org.springframework.mock.web.MockMultipartFile;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
@Transactional
class BackendApiTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private PgRepository pgs;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void demoAccountsAuthenticateAndAccessIsRoleRestricted() throws Exception {
        String guestToken = login("guest@pgfinder.local");
        mvc.perform(get("/api/auth/me").header("Authorization", bearer(guestToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("USER"));

        mvc.perform(get("/api/owner/pgs").header("Authorization", bearer(guestToken)))
                .andExpect(status().isForbidden());

        mvc.perform(get("/api/owner/pgs").header("Authorization", bearer(login("owner1@pgfinder.local"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(5)));

        mvc.perform(get("/api/owner/bookings")
                        .header("Authorization", bearer(login("owner1@pgfinder.local"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)));
    }

    @Test
    void newOwnerListingsArePendingAdminApproval() throws Exception {
        String ownerToken = login("owner1@pgfinder.local");
        String body = """
                {
                  "name":"Test Owner Listing",
                  "gender":"Boys",
                  "address":"1 Sample Road",
                  "locality":"Madhapur",
                  "city":"Hyderabad",
                  "lat":17.4486,
                  "lng":78.3908,
                  "phone":"+919999999999",
                  "description":"A sample listing",
                  "amenities":["Wi-Fi"],
                  "rules":[],
                  "images":[],
                  "foodMenu":{},
                  "depositMonths":1
                }
                """;

        mvc.perform(post("/api/owner/pgs")
                        .header("Authorization", bearer(ownerToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.ownerId").value("u-owner1"))
                .andExpect(jsonPath("$.status").value("pending"));
    }

    @Test
    void registrationReturnsAnAuthenticatedUserToken() throws Exception {
        String email = "new-user-" + java.util.UUID.randomUUID() + "@pgfinder.local";
        MvcResult result = mvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"New User","email":"%s","password":"a-safe-password","role":"USER"}
                                """.formatted(email)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.role").value("USER"))
                .andReturn();
        String token = objectMapper.readTree(result.getResponse().getContentAsString()).get("token").asText();

        mvc.perform(get("/api/auth/me").header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(email));
    }

    @Test
    void onlyGuestsWithConfirmedBookingsCanReviewAndAuthorsCanUpdateReviews() throws Exception {
        String token = login("guest@pgfinder.local");
        String reviewBody = """
                {"rating":5,"comment":"Clean rooms and friendly staff"}
                """;
        MvcResult created = mvc.perform(post("/api/pgs/pg-1/reviews")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reviewBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.rating").value(5))
                .andReturn();
        String reviewId = objectMapper.readTree(created.getResponse().getContentAsString())
                .get("id").asText();

        mvc.perform(put("/api/reviews/" + reviewId)
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"rating":4,"comment":"Updated review"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rating").value(4));
    }

    @Test
    void complaintsAreVisibleToTheRelevantOwnerAndCanBeUpdated() throws Exception {
        String guestToken = login("guest@pgfinder.local");
        MvcResult created = mvc.perform(post("/api/complaints")
                        .header("Authorization", bearer(guestToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"pgId":"pg-1","subject":"Water issue","description":"Hot water is unavailable"}
                                """))
                .andExpect(status().isCreated())
                .andReturn();
        String complaintId = objectMapper.readTree(created.getResponse().getContentAsString())
                .get("id").asText();
        String ownerToken = login("owner1@pgfinder.local");

        mvc.perform(get("/api/owner/complaints").header("Authorization", bearer(ownerToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].id", hasItem(complaintId)));

        mvc.perform(patch("/api/owner/complaints/" + complaintId)
                        .header("Authorization", bearer(ownerToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"status":"resolved","response":"Maintenance has fixed it"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("resolved"));
    }

    @Test
    void ownersCanUploadAndRemoveLocalImages() throws Exception {
        String ownerToken = login("owner1@pgfinder.local");
        byte[] pngSignature = {(byte) 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a};
        MockMultipartFile file = new MockMultipartFile("file", "room.png", "image/png", pngSignature);
        MvcResult created = mvc.perform(multipart("/api/owner/pgs/pg-1/images")
                        .file(file)
                        .header("Authorization", bearer(ownerToken)))
                .andExpect(status().isCreated())
                .andReturn();
        JsonNode image = objectMapper.readTree(created.getResponse().getContentAsString());
        String imageId = image.get("id").asText();
        java.nio.file.Path storedFile = java.nio.file.Path.of("uploads",
                image.get("url").asText().substring("/uploads/".length())).toAbsolutePath();
        try {
            org.junit.jupiter.api.Assertions.assertTrue(java.nio.file.Files.exists(storedFile));
            mvc.perform(delete("/api/owner/pgs/pg-1/images/" + imageId)
                            .header("Authorization", bearer(ownerToken)))
                    .andExpect(status().isNoContent());
            org.junit.jupiter.api.Assertions.assertFalse(java.nio.file.Files.exists(storedFile));
        } finally {
            java.nio.file.Files.deleteIfExists(storedFile);
        }
    }

    @Test
    void bookingPreventsOverlappingDatesForTheSameBed() throws Exception {
        Bed freeBed = pgs.findById("pg-1").orElseThrow().getRooms().stream()
                .flatMap(room -> room.getBeds().stream())
                .filter(bed -> "available".equals(bed.getStatus()))
                .findFirst().orElseThrow();
        String guestToken = login("guest@pgfinder.local");
        LocalDate start = LocalDate.now().plusDays(45);
        LocalDate end = start.plusDays(4);
        String body = """
                {"bedId":%d,"startDate":"%s","endDate":"%s"}
                """.formatted(freeBed.getId(), start, end);

        mvc.perform(post("/api/bookings")
                        .header("Authorization", bearer(guestToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("confirmed"));

        mvc.perform(post("/api/bookings")
                        .header("Authorization", bearer(guestToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isConflict());
    }

    private String login(String email) throws Exception {
        MvcResult result = mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","password":"demo1234"}
                                """.formatted(email)))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode response = objectMapper.readTree(result.getResponse().getContentAsString());
        return response.get("token").asText();
    }

    private static String bearer(String token) {
        return "Bearer " + token;
    }
}
