package com.unicore.booking.dto;

import com.unicore.booking.entity.Booking;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookingResponse {

    private String id;

    private String userId;

    private String userName;

    private String userEmail;

    private String facilityId;

    private String facilityName;

    private LocalDate bookingDate;

    private LocalTime startTime;

    private LocalTime endTime;

    private String purpose;

    private Integer attendees;

    private List<String> selectedEquipments;

    private Booking.Status status;

    private String adminResponse;

    private Instant createdAt;
}
