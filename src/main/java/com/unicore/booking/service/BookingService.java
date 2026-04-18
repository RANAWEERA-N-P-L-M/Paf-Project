package com.unicore.booking.service;

import com.unicore.booking.dto.BookingResponse;
import com.unicore.booking.dto.CreateBookingRequest;
import com.unicore.booking.dto.MostBookedResourceResponse;
import com.unicore.booking.entity.Booking;
import com.unicore.booking.repository.BookingRepository;
import com.unicore.entity.Notification;
import com.unicore.entity.User;
import com.unicore.facility.entity.Catalogue;
import com.unicore.facility.repository.CatalogueRepository;
import com.unicore.repository.UserRepository;
import com.unicore.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class BookingService {

    private static final Pattern CAPACITY_NUMBER_PATTERN = Pattern.compile("\\d+");

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final CatalogueRepository catalogueRepository;
    private final NotificationService notificationService;

    public BookingResponse createBooking(CreateBookingRequest request, String requesterEmail) {
        validateCreateRequest(request);
        String facilityId = request.getFacilityId().trim();

        User user = findUserByEmail(requesterEmail);
        if (user.getStatus() != User.Status.APPROVED) {
            throw new RuntimeException("Only approved users can create bookings.");
        }

        Catalogue catalogue = catalogueRepository.findById(facilityId)
                .orElseThrow(() -> new RuntimeException("Facility not found."));

        if (catalogue.getStatus() != Catalogue.Status.ACTIVE) {
            throw new RuntimeException("Cannot book a facility that is out of service.");
        }

        validateBookingTime(request.getBookingDate(), request.getStartTime(), request.getEndTime());
        ensureNoOverlapWithStatuses(facilityId,
                request.getBookingDate(),
                request.getStartTime(),
                request.getEndTime(),
            List.of(Booking.Status.PENDING, Booking.Status.APPROVED),
            null,
            "Booking conflict: this facility already has a booking request or approved booking in the selected time range.");
        validateAttendees(request.getAttendees(), parseCapacity(catalogue.getCapacity()));
        List<String> selectedEquipments = validateSelectedEquipments(request.getSelectedEquipments(), catalogue.getEquipments());

        Booking booking = new Booking();
        booking.setUserId(user.getId());
        booking.setFacilityId(facilityId);
        booking.setFacilityName(catalogue.getName());
        booking.setBookingDate(request.getBookingDate());
        booking.setStartTime(request.getStartTime());
        booking.setEndTime(request.getEndTime());
        booking.setPurpose(request.getPurpose().trim());
        booking.setAttendees(request.getAttendees());
        booking.setSelectedEquipments(selectedEquipments);
        booking.setStatus(Booking.Status.PENDING);
        booking.setAdminResponse("");
        booking.setCreatedAt(Instant.now());

        BookingResponse response = toResponse(bookingRepository.save(booking));
        notificationService.notifyAllAdmins(
                "New booking request from " + user.getName() + " for " + catalogue.getName(),
                Notification.Type.BOOKING,
                response.getId()
        );
        return response;
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

    public List<MostBookedResourceResponse> getMostBookedResources() {
        Map<String, MostBookedResourceResponse> countsByFacility = new LinkedHashMap<>();

        bookingRepository.findAll().stream()
                .filter(booking -> booking.getStatus() == Booking.Status.APPROVED)
                .forEach(booking -> {
                    String facilityKey = booking.getFacilityId() == null || booking.getFacilityId().isBlank()
                            ? booking.getFacilityName()
                            : booking.getFacilityId();

                    if (facilityKey == null || facilityKey.isBlank()) {
                        facilityKey = "unknown-resource";
                    }

                    MostBookedResourceResponse current = countsByFacility.getOrDefault(
                            facilityKey,
                            new MostBookedResourceResponse(
                                    booking.getFacilityId(),
                                    booking.getFacilityName(),
                                    0L
                            )
                    );

                    current.setBookingCount(current.getBookingCount() + 1);
                    countsByFacility.put(facilityKey, current);
                });

        return countsByFacility.values().stream()
                .sorted(Comparator
                        .comparingLong(MostBookedResourceResponse::getBookingCount)
                        .reversed()
                        .thenComparing(response -> trimToEmpty(response.getFacilityName()).toLowerCase()))
                .limit(5)
                .toList();
        }

    public BookingResponse approveBooking(String bookingId, String adminResponse) {
        Booking booking = findBookingById(bookingId);

        if (booking.getStatus() != Booking.Status.PENDING) {
            throw new RuntimeException("Only pending bookings can be approved.");
        }

        ensureNoOverlapWithStatuses(booking.getFacilityId(),
                booking.getBookingDate(),
                booking.getStartTime(),
                booking.getEndTime(),
            List.of(Booking.Status.APPROVED),
            booking.getId(),
            "Booking conflict: this facility already has an approved booking in the selected time range.");

        booking.setStatus(Booking.Status.APPROVED);
        booking.setAdminResponse(trimToEmpty(adminResponse));

        BookingResponse response = toResponse(bookingRepository.save(booking));
        notificationService.createNotification(
                booking.getUserId(),
                "Your booking for " + booking.getFacilityName() + " has been approved.",
                Notification.Type.BOOKING,
                booking.getId()
        );
        return response;
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

        BookingResponse response = toResponse(bookingRepository.save(booking));
        notificationService.createNotification(
                booking.getUserId(),
                "Your booking for " + booking.getFacilityName() + " has been rejected.",
                Notification.Type.BOOKING,
                booking.getId()
        );
        return response;
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

    private void ensureNoOverlapWithStatuses(String facilityId,
                                             LocalDate bookingDate,
                                             LocalTime startTime,
                                             LocalTime endTime,
                                             List<Booking.Status> statuses,
                                             String excludeBookingId,
                                             String conflictMessage) {
        List<Booking> existingBookings = bookingRepository.findByFacilityIdAndBookingDateAndStatusIn(
                facilityId,
                bookingDate,
                statuses
        );

        boolean hasOverlap = existingBookings.stream()
                .filter(existing -> excludeBookingId == null || !excludeBookingId.equals(existing.getId()))
                .anyMatch(existing -> isOverlapping(startTime, endTime, existing.getStartTime(), existing.getEndTime()));

        if (hasOverlap) {
            throw new RuntimeException(conflictMessage);
        }
    }

    private void validateAttendees(Integer attendees, Integer facilityCapacity) {
        if (attendees == null) {
            return;
        }
        if (attendees <= 0) {
            throw new RuntimeException("Attendees must be greater than 0 when provided.");
        }
        if (facilityCapacity == null || facilityCapacity <= 0) {
            throw new RuntimeException("Facility capacity is not configured for booking.");
        }
        if (attendees > facilityCapacity) {
            throw new RuntimeException("Attendees cannot exceed facility capacity (" + facilityCapacity + ").");
        }
    }

    private boolean isOverlapping(LocalTime startA, LocalTime endA, LocalTime startB, LocalTime endB) {
        return startA.isBefore(endB) && endA.isAfter(startB);
    }

    private List<String> validateSelectedEquipments(List<String> requestedEquipments, List<String> availableEquipments) {
        List<String> normalizedAvailable = normalizeEquipments(availableEquipments);
        List<String> normalizedRequested = normalizeEquipments(requestedEquipments);

        if (normalizedAvailable.isEmpty()) {
            return normalizedRequested;
        }

        if (normalizedRequested.isEmpty()) {
            throw new RuntimeException("Please select at least one equipment needed for this booking.");
        }

        Set<String> availableSet = new LinkedHashSet<>(normalizedAvailable);
        boolean hasInvalidEquipment = normalizedRequested.stream().anyMatch(item -> !availableSet.contains(item));
        if (hasInvalidEquipment) {
            throw new RuntimeException("One or more selected equipments are not available in this facility.");
        }

        return normalizedRequested;
    }

    private List<String> normalizeEquipments(List<String> equipments) {
        if (equipments == null || equipments.isEmpty()) {
            return List.of();
        }

        Set<String> normalized = new LinkedHashSet<>();
        for (String item : equipments) {
            if (item == null) {
                continue;
            }
            String trimmed = item.trim();
            if (!trimmed.isEmpty()) {
                normalized.add(trimmed);
            }
        }
        return new ArrayList<>(normalized);
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
                booking.getSelectedEquipments(),
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

    private Integer parseCapacity(String capacity) {
        if (capacity == null || capacity.trim().isEmpty()) {
            return null;
        }

        String normalized = capacity.trim();
        try {
            int direct = Integer.parseInt(normalized);
            return direct > 0 ? direct : null;
        } catch (NumberFormatException ignored) {
            // Fall through to range/text parsing.
        }

        Matcher matcher = CAPACITY_NUMBER_PATTERN.matcher(normalized);
        Integer maxCapacity = null;
        while (matcher.find()) {
            int value = Integer.parseInt(matcher.group());
            if (value <= 0) {
                continue;
            }
            if (maxCapacity == null || value > maxCapacity) {
                maxCapacity = value;
            }
        }
        return maxCapacity;
    }
}
