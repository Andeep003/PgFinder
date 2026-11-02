package com.pgfinder.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** One bed in a room (A, B, C, D). Table: beds. */
@Entity
@Table(name = "beds", uniqueConstraints = @UniqueConstraint(columnNames = {"room_id", "bed_no"}))
@Getter
@Setter
@NoArgsConstructor
public class Bed {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "room_id")
    private Room room;

    @Column(name = "bed_no")
    private String bedNo;

    /** available | booked | occupied | maintenance */
    private String status = "available";

    /** Booking holding this bed; becomes a link to the Booking table in a later step. */
    private String bookingId;

    public Bed(String bedNo, String status) {
        this.bedNo = bedNo;
        this.status = status;
    }
}
