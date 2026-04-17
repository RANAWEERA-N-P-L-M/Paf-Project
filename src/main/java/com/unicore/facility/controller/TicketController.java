package com.unicore.facility.controller;

import com.unicore.facility.dto.AssignTechniciansRequest;
import com.unicore.facility.dto.CreateTicketRequest;
import com.unicore.facility.entity.TechnicianAssignment;
import com.unicore.facility.entity.Ticket;
import com.unicore.facility.service.TicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','USER','TECHNICIAN')")
    public ResponseEntity<Ticket> createTicket(@RequestBody CreateTicketRequest request,
                                               Authentication authentication) {
        String authenticatedEmail = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(ticketService.createTicket(request, authenticatedEmail));
    }

    @PostMapping("/{id}/assign")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<TechnicianAssignment>> assignTicket(@PathVariable("id") String ticketId,
                                                                   @RequestBody AssignTechniciansRequest request) {
        return ResponseEntity.ok(ticketService.assignTechnicians(ticketId, request));
    }
}
