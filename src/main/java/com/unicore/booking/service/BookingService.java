package com.unicore.booking.service;

import com.unicore.booking.dto.BookingResponse;
import com.unicore.booking.dto.CreateBookingRequest;
import com.unicore.booking.entity.Booking;
import com.unicore.booking.repository.BookingRepository;
import com.unicore.entity.User;
import com.unicore.facility.entity.Catalogue;
import com.unicore.facility.repository.CatalogueRepository;
import com.unicore.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final CatalogueRepository catalogueRepository;

    public BookingResponse createBooking(CreateBookingRequest request, String requesterEmail) {
        validateCreateRequest(request);

        User user = findUserByEmail(requesterEmail);
        if (user.getStatus() != User.Status.APPROVED) {
            throw new RuntimeException("Only approved users can create bookings.");
        }

        Catalogue catalogue = catalogueRepository.findById(request.getFacilityId().trim())
                .orElseThrow(() -> new RuntimeException("Facility not found."));

        if (catalogue.getStatus() != Catalogue.Status.ACTIVE) {
            throw new RuntimeException("Cannot book a facility that is out of service.");
        }

        validateBookingTime(request.getBookingDate(), request.getStartTime(), request.getEndTime());
        ensureNoOverlapWithApproved(request.getFacilityId().trim(),
                request.getBookingDate(),
                request.getStartTime(),
                request.getEndTime(),
                null);

        if (request.getAttendees() != null && request.getAttendees() <= 0) {
            throw new RuntimeException("Attendees must be greater than 0 when provided.");
        }

        Booking booking = new Booking();
        booking.setUserId(user.getId());
        booking.setFacilityId(catalogue.getId());
        booking.setFacilityName(catalogue.getName());
        booking.setBookingDate(request.getBookingDate());
        booking.setStartTime(request.getStartTime());
        booking.setEndTime(request.getEndTime());
        booking.setPurpose(request.getPurpose().trim());
        booking.setAttendees(request.getAttendees());
        booking.setStatus(Booking.Status.PENDING);
        booking.setAdminResponse("");
        booking.setCreatedAt(Instant.now());

        return toResponse(bookingRepository.save(booking));
    }

    public List<BookingResponse> getMyBookings(String requesterEmail) {
        User user = findUserByEmail(requesterEmail);
        return bookingRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public BookingResponse cancelMyBooking(String bookingId, String requesterEmail) {
        User user = findUserByEmail(requesterEmail);
        Booking booking = findBookingById(bookingId);

        if (!user.getId().equals(booking.getUserId())) {
            throw new RuntimeException("You can cancel only your own bookings.");
        }

        if (booking.getStatus() != Booking.Status.PENDING && booking.getStatus() != Booking.Status.APPROVED) {
            throw new RuntimeException("Only pending or approved bookings can be cancelled.");
        }

        booking.setStatus(Booking.Status.CANCELLED);
        if (isBlank(booking.getAdminResponse())) {
            booking.setAdminResponse("Cancelled by user.");
        }

        return toResponse(bookingRepository.save(booking));
    }

    public List<BookingResponse> getAllBookings() {
        return bookingRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public BookingResponse approveBooking(String bookingId, String adminResponse) {
        Booking booking = findBookingById(bookingId);

        if (booking.getStatus() != Booking.Status.PENDING) {
            throw new RuntimeException("Only pending bookings can be approved.");
        }

        ensureNoOverlapWithApproved(booking.getFacilityId(),
                booking.getBookingDate(),
                booking.getStartTime(),
                booking.getEndTime(),
                booking.getId());

        booking.setStatus(Booking.Status.APPROVED);
        booking.setAdminResponse(trimToEmpty(adminResponse));

        return toResponse(bookingRepository.save(booking));
    }

    public BookingResponse rejectBooking(String bookingId, String reason) {
        Booking booking = findBookingById(bookingId);

        if (booking.getStatus() != Booking.Status.PENDING) {
            throw new RuntimeException("Only pending bookings can be rejected.");
        }

        if (isBlank(reason)) {
            throw new RuntimeException("Rejection reason is required.");
        }

        booking.setStatus(Booking.Status.REJECTED);
        booking.setAdminResponse(reason.trim());

        return toResponse(bookingRepository.save(booking));
    }

    private void validateCreateRequest(CreateBookingRequest request) {
        if (request == null) {
            throw new RuntimeException("Request body is required.");
        }
        if (isBlank(request.getFacilityId())) {
            throw new RuntimeException("Facility id is required.");
        }
        if (request.getBookingDate() == null) {
            throw new RuntimeException("Booking date is required.");
        }
        if (request.getStartTime() == null || request.getEndTime() == null) {
            throw new RuntimeException("Start time and end time are required.");
        }
        if (isBlank(request.getPurpose())) {
            throw new RuntimeException("Purpose is required.");
        }
    }

    private void validateBookingTime(LocalDate bookingDate, LocalTime startTime, LocalTime endTime) {
        if (!endTime.isAfter(startTime)) {
            throw new RuntimeException("End time must be after start time.");
        }
        if (bookingDate.isBefore(LocalDate.now())) {
            throw new RuntimeException("Booking date cannot be in the past.");
        }
    }

    private void ensureNoOverlapWithApproved(String facilityId,
                                             LocalDate bookingDate,
                                             LocalTime startTime,
                                             LocalTime endTime,
                                             String excludeBookingId) {
        List<Booking> approvedBookings = bookingRepository.findByFacilityIdAndBookingDateAndStatus(
                facilityId,
                bookingDate,
                Booking.Status.APPROVED
        );

        boolean hasOverlap = approvedBookings.stream()
                .filter(existing -> excludeBookingId == null || !excludeBookingId.equals(existing.getId()))
                .anyMatch(existing -> isOverlapping(startTime, endTime, existing.getStartTime(), existing.getEndTime()));

        if (hasOverlap) {
            throw new RuntimeException("Booking conflict: this facility already has an approved booking in the selected time range.");
        }
    }

    private boolean isOverlapping(LocalTime startA, LocalTime endA, LocalTime startB, LocalTime endB) {
        return startA.isBefore(endB) && endA.isAfter(startB);
    }

    private Booking findBookingById(String id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found."));
    }

    private User findUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found."));
    }

    private BookingResponse toResponse(Booking booking) {
        User user = userRepository.findById(booking.getUserId()).orElse(null);

        String userName = user != null ? user.getName() : "Unknown User";
        String userEmail = user != null ? user.getEmail() : "";

        return new BookingResponse(
                booking.getId(),
                booking.getUserId(),
                userName,
                userEmail,
                booking.getFacilityId(),
                booking.getFacilityName(),
                booking.getBookingDate(),
                booking.getStartTime(),
                booking.getEndTime(),
                booking.getPurpose(),
                booking.getAttendees(),
                booking.getStatus(),
                booking.getAdminResponse(),
                booking.getCreatedAt()
        );
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private String trimToEmpty(String value) {
        return value == null ? "" : value.trim();
    }
}
