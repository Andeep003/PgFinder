package com.pgfinder.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

/** A room inside a PG. Table: rooms. */
@Entity
@Table(name = "rooms")
@Getter
@Setter
@NoArgsConstructor
public class Room {

    @Id
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pg_id")
    private Pg pg;

    private String roomNo;
    private int floor;

    /** Beds in the room: 1-4. */
    private int sharing;

    /** "Single Sharing", "Double Sharing", ... */
    private String type;

    private boolean ac;
    private boolean attachedBathroom;
    private int rentPerBed;

    @OneToMany(mappedBy = "room", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("bedNo")
    private List<Bed> beds = new ArrayList<>();

    public void addBed(Bed bed) {
        bed.setRoom(this);
        beds.add(bed);
    }
}
