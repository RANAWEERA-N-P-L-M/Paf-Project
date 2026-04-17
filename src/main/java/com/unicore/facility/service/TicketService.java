package com.unicore.facility.service;

import com.unicore.entity.User;
import com.unicore.facility.dto.AssignTechniciansRequest;
import com.unicore.facility.dto.CreateTicketRequest;
import com.unicore.facility.entity.TechnicianAssignment;
import com.unicore.facility.entity.Ticket;
import com.unicore.facility.repository.TechnicianAssignmentRepository;
import com.unicore.facility.repository.TicketRepository;
import com.unicore.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class TicketService {

    private final TicketRepository ticketRepository;
    private final TechnicianAssignmentRepository technicianAssignmentRepository;
    private final UserRepository userRepository;

    public Ticket createTicket(CreateTicketRequest request, String authenticatedEmail) {
        validateRequest(request);

        User createdBy = resolveCreatedBy(request, authenticatedEmail);

        Ticket ticket = new Ticket();
        ticket.setTitle(request.getTitle().trim());
        ticket.setDescription(request.getDescription().trim());
        ticket.setStatus(Ticket.Status.OPEN);
        ticket.setCreatedAt(Instant.now());
        ticket.setCreatedBy(createdBy);

        return ticketRepository.save(ticket);
    }

    public List<TechnicianAssignment> assignTechnicians(String ticketId, AssignTechniciansRequest request) {
        validateAssignRequest(request);

        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found."));

        if (ticket.getStatus() != Ticket.Status.OPEN) {
            ticket.setStatus(Ticket.Status.OPEN);
            ticketRepository.save(ticket);
        }

        List<TechnicianAssignment> existingAssignments = technicianAssignmentRepository.findByTicket(ticket);
        Set<String> existingTechnicianIds = new HashSet<>();
        for (TechnicianAssignment assignment : existingAssignments) {
            if (assignment.getTechnician() != null && assignment.getTechnician().getId() != null) {
                existingTechnicianIds.add(assignment.getTechnician().getId());
            }
        }

        Set<String> uniqueInputIds = new HashSet<>();
        List<TechnicianAssignment> newAssignments = new ArrayList<>();

        for (String rawId : request.getTechnicianIds()) {
            if (isBlank(rawId)) {
                continue;
            }

            String technicianId = rawId.trim();
            if (!uniqueInputIds.add(technicianId)) {
                continue;
            }
            if (existingTechnicianIds.contains(technicianId)) {
                continue;
            }

            User technician = userRepository.findById(technicianId)
                    .orElseThrow(() -> new RuntimeException("Technician not found: " + technicianId));

            if (technician.getRole() != User.Role.TECHNICIAN) {
                throw new RuntimeException("User is not a technician: " + technicianId);
            }

            TechnicianAssignment assignment = new TechnicianAssignment();
            assignment.setTicket(ticket);
            assignment.setTechnician(technician);
            assignment.setStatus(Ticket.Status.OPEN);
            assignment.setRejectionReason(null);
            newAssignments.add(assignment);
        }

        if (newAssignments.isEmpty()) {
            return List.of();
        }

        return technicianAssignmentRepository.saveAll(newAssignments);
    }

    private User resolveCreatedBy(CreateTicketRequest request, String authenticatedEmail) {
        if (!isBlank(authenticatedEmail) && !"anonymousUser".equalsIgnoreCase(authenticatedEmail)) {
            return userRepository.findByEmail(authenticatedEmail)
                    .orElseThrow(() -> new RuntimeException("Authenticated user not found."));
        }

        if (!isBlank(request.getUserId())) {
            return userRepository.findById(request.getUserId().trim())
                    .orElseThrow(() -> new RuntimeException("User not found for given userId."));
        }

        throw new RuntimeException("Unable to resolve ticket creator. Authenticate or provide userId.");
    }

    private void validateRequest(CreateTicketRequest request) {
        if (request == null) {
            throw new RuntimeException("Request body is required.");
        }
        if (isBlank(request.getTitle())) {
            throw new RuntimeException("Title is required.");
        }
        if (isBlank(request.getDescription())) {
            throw new RuntimeException("Description is required.");
        }
    }

    private void validateAssignRequest(AssignTechniciansRequest request) {
        if (request == null || request.getTechnicianIds() == null || request.getTechnicianIds().isEmpty()) {
            throw new RuntimeException("technicianIds list is required.");
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
