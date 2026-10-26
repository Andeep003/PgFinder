package com.pgfinder.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** A PG (paying guest) property. Table: pgs. */
@Entity
@Table(name = "pgs")
@Getter
@Setter
@NoArgsConstructor
public class Pg {

    /** String ids ("pg-1") so they match the ids the frontend already uses in its URLs. */
    @Id
    private String id;

    /** Becomes a link to the User table in step 2. */
    private String ownerId;

    @Column(nullable = false)
    private String name;

    /** Boys | Girls | Co-living */
    private String gender;

    private String address;
    private String locality;
    private String city;
    private double lat;
    private double lng;
    private String phone;

    @Column(length = 2000)
    private String description;

    @ElementCollection
    @CollectionTable(name = "pg_amenities", joinColumns = @JoinColumn(name = "pg_id"))
    @OrderColumn(name = "position")
    @Column(name = "amenity")
    private List<String> amenities = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "pg_rules", joinColumns = @JoinColumn(name = "pg_id"))
    @OrderColumn(name = "position")
    @Column(name = "rule")
    private List<String> rules = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "pg_images", joinColumns = @JoinColumn(name = "pg_id"))
    @OrderColumn(name = "position")
    @Column(name = "url", length = 1000)
    private List<String> images = new ArrayList<>();

    /** { "Monday": { "breakfast": "...", "lunch": "...", "dinner": "..." }, ... } stored as JSON text. */
    @Convert(converter = FoodMenuConverter.class)
    @Column(columnDefinition = "TEXT")
    private Map<String, Map<String, String>> foodMenu = new LinkedHashMap<>();

    private int depositMonths = 1;

    /** pending | approved | rejected | disabled - only approved PGs are shown publicly. */
    private String status = "pending";

    private LocalDate createdAt;

    @OneToMany(mappedBy = "pg", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("roomNo")
    private List<Room> rooms = new ArrayList<>();

    public void addRoom(Room room) {
        room.setPg(this);
        rooms.add(room);
    }
}
