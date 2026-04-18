package com.unicore.booking.controller;

import com.unicore.booking.dto.BookingDecisionRequest;
import com.unicore.booking.dto.BookingResponse;
import com.unicore.booking.dto.CreateBookingRequest;
import com.unicore.booking.dto.MostBookedResourceResponse;
import com.unicore.booking.service.BookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @PostMapping
    @PreAuthorize("hasAnyRole('USER','TECHNICIAN')")
    public ResponseEntity<BookingResponse> createBooking(@RequestBody CreateBookingRequest request,
                                                         Authentication authentication) {
        return ResponseEntity.ok(bookingService.createBooking(request, authentication.getName()));
    }

    @GetMapping("/my")
    @PreAuthorize("hasAnyRole('USER','TECHNICIAN')")
    public ResponseEntity<List<BookingResponse>> getMyBookings(Authentication authentication) {
        return ResponseEntity.ok(bookingService.getMyBookings(authentication.getName()));
    }

    @PutMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('USER','TECHNICIAN')")
    public ResponseEntity<BookingResponse> cancelBooking(@PathVariable String id,
                                                         Authentication authentication) {
        return ResponseEntity.ok(bookingService.cancelMyBooking(id, authentication.getName()));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<BookingResponse>> getAllBookings() {
        return ResponseEntity.ok(bookingService.getAllBookings());
    }

    @GetMapping("/report/most-booked-resources")
    @PreAuthorize("hasAnyRole('USER','TECHNICIAN','ADMIN')")
    public ResponseEntity<List<MostBookedResourceResponse>> getMostBookedResources() {
        return ResponseEntity.ok(bookingService.getMostBookedResources());
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BookingResponse> approveBooking(@PathVariable String id,
                                                          @RequestBody(required = false) BookingDecisionRequest request) {
        String adminResponse = request == null ? null : request.getAdminResponse();
        return ResponseEntity.ok(bookingService.approveBooking(id, adminResponse));
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BookingResponse> rejectBooking(@PathVariable String id,
                                                         @RequestBody BookingDecisionRequest request) {
        return ResponseEntity.ok(bookingService.rejectBooking(id, request.getAdminResponse()));
    }
}
