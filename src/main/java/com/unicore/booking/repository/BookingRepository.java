package com.unicore.booking.repository;

import com.unicore.booking.entity.Booking;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.LocalDate;
import java.util.List;

public interface BookingRepository extends MongoRepository<Booking, String> {

    List<Booking> findByUserIdOrderByCreatedAtDesc(String userId);

    List<Booking> findAllByOrderByCreatedAtDesc();

    List<Booking> findByFacilityIdAndBookingDateAndStatusIn(String facilityId,
                                                            LocalDate bookingDate,
                                                            List<Booking.Status> statuses);
}
