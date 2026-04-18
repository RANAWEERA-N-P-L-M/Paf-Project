package com.unicore.facility.service;

import com.unicore.entity.User;
import com.unicore.facility.dto.AssignedTechnicianDto;
import com.unicore.facility.dto.AssignTechniciansRequest;
import com.unicore.facility.dto.CreateTicketRequest;
import com.unicore.facility.dto.TicketDashboardResponse;
import com.unicore.facility.entity.TechnicianAssignment;
import com.unicore.facility.entity.Ticket;
import com.unicore.facility.exception.ResourceNotFoundException;
import com.unicore.facility.exception.ValidationException;
import com.unicore.facility.repository.TechnicianAssignmentRepository;
import com.unicore.facility.repository.TicketRepository;
import com.unicore.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TicketService {

    private final TicketRepository ticketRepository;
    private final TechnicianAssignmentRepository technicianAssignmentRepository;
    private final UserRepository userRepository;
    private final MongoTemplate mongoTemplate;

    public Ticket createTicket(CreateTicketRequest request, String authenticatedEmail) {
        if (request == null) {
            throw new ValidationException("Request body is required.");
        }

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
        List<String> technicianIds = normalizeTechnicianIds(request.getTechnicianIds());
        if (technicianIds.isEmpty()) {
            throw new ValidationException("At least one valid technicianId is required.");
        }

        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found."));

        ensureTicketOpen(ticket);

        List<TechnicianAssignment> existingAssignments = technicianAssignmentRepository.findByTicket(ticket);
        Set<String> existingTechnicianIds = new HashSet<>();
        for (TechnicianAssignment assignment : existingAssignments) {
            if (assignment.getTechnician() != null && assignment.getTechnician().getId() != null) {
                existingTechnicianIds.add(assignment.getTechnician().getId());
            }
        }

        List<TechnicianAssignment> newAssignments = new ArrayList<>();

        for (String technicianId : technicianIds) {
            if (existingTechnicianIds.contains(technicianId)) {
                continue;
            }

            User technician = userRepository.findById(technicianId)
                    .orElseThrow(() -> new ResourceNotFoundException("Technician not found: " + technicianId));

            if (technician.getRole() != User.Role.TECHNICIAN) {
                throw new ValidationException("User is not a technician: " + technicianId);
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

    public List<TicketDashboardResponse> getTicketsForAdmin(String status, Instant fromDate, Instant toDate) {
        if (fromDate != null && toDate != null && fromDate.isAfter(toDate)) {
            throw new ValidationException("fromDate must be before or equal to toDate.");
        }

        Query query = new Query().with(Sort.by(Sort.Direction.DESC, "createdAt"));
        List<Criteria> criteriaList = new ArrayList<>();

        if (!isBlank(status)) {
            criteriaList.add(Criteria.where("status").is(parseTicketStatus(status)));
        }

        if (fromDate != null && toDate != null) {
            criteriaList.add(Criteria.where("createdAt").gte(fromDate).lte(toDate));
        } else if (fromDate != null) {
            criteriaList.add(Criteria.where("createdAt").gte(fromDate));
        } else if (toDate != null) {
            criteriaList.add(Criteria.where("createdAt").lte(toDate));
        }

        if (!criteriaList.isEmpty()) {
            query.addCriteria(new Criteria().andOperator(criteriaList.toArray(new Criteria[0])));
        }

        List<Ticket> tickets = mongoTemplate.find(query, Ticket.class);
        if (tickets.isEmpty()) {
            return List.of();
        }

        List<TechnicianAssignment> assignments = technicianAssignmentRepository.findByTicketIn(tickets);
        Map<String, List<AssignedTechnicianDto>> assignmentsByTicketId = mapAssignmentsByTicketId(assignments);

        List<TicketDashboardResponse> response = new ArrayList<>();
        for (Ticket ticket : tickets) {
            response.add(new TicketDashboardResponse(
                    ticket.getId(),
                    ticket.getTitle(),
                    ticket.getDescription(),
                    ticket.getStatus(),
                    ticket.getCreatedAt(),
                    assignmentsByTicketId.getOrDefault(ticket.getId(), List.of())
            ));
        }

        return response;
    }

    public List<TicketDashboardResponse> getMyTickets(String authenticatedEmail) {
        if (isBlank(authenticatedEmail) || "anonymousUser".equalsIgnoreCase(authenticatedEmail)) {
            throw new ValidationException("Authenticated user is required.");
        }

        User currentUser = userRepository.findByEmail(authenticatedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found."));

        Query query = new Query()
                .addCriteria(Criteria.where("createdBy").is(currentUser))
                .with(Sort.by(Sort.Direction.DESC, "createdAt"));

        List<Ticket> tickets = mongoTemplate.find(query, Ticket.class);
        if (tickets.isEmpty()) {
            return List.of();
        }

        List<TechnicianAssignment> assignments = technicianAssignmentRepository.findByTicketIn(tickets);
        Map<String, List<AssignedTechnicianDto>> assignmentsByTicketId = mapAssignmentsByTicketId(assignments);

        List<TicketDashboardResponse> response = new ArrayList<>();
        for (Ticket ticket : tickets) {
            response.add(new TicketDashboardResponse(
                    ticket.getId(),
                    ticket.getTitle(),
                    ticket.getDescription(),
                    ticket.getStatus(),
                    ticket.getCreatedAt(),
                    assignmentsByTicketId.getOrDefault(ticket.getId(), List.of())
            ));
        }
        return response;
    }

    private User resolveCreatedBy(CreateTicketRequest request, String authenticatedEmail) {
        if (!isBlank(authenticatedEmail) && !"anonymousUser".equalsIgnoreCase(authenticatedEmail)) {
            return userRepository.findByEmail(authenticatedEmail)
                    .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found."));
        }

        if (!isBlank(request.getUserId())) {
            return userRepository.findById(request.getUserId().trim())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found for given userId."));
        }

        throw new ValidationException("Unable to resolve ticket creator. Authenticate or provide userId.");
    }

    private void validateAssignRequest(AssignTechniciansRequest request) {
        if (request == null || request.getTechnicianIds() == null || request.getTechnicianIds().isEmpty()) {
            throw new ValidationException("technicianIds list is required.");
        }
    }

    private Ticket.Status parseTicketStatus(String status) {
        try {
            return Ticket.Status.valueOf(status.trim().toUpperCase());
        } catch (Exception ex) {
            throw new ValidationException("Invalid status value.");
        }
    }

    private Map<String, List<AssignedTechnicianDto>> mapAssignmentsByTicketId(List<TechnicianAssignment> assignments) {
        if (assignments == null || assignments.isEmpty()) {
            return Collections.emptyMap();
        }

        Map<String, List<AssignedTechnicianDto>> grouped = new HashMap<>();

        for (TechnicianAssignment assignment : assignments) {
            if (assignment.getTicket() == null || assignment.getTicket().getId() == null) {
                continue;
            }

            String ticketId = assignment.getTicket().getId();
            User technician = assignment.getTechnician();

            AssignedTechnicianDto dto = new AssignedTechnicianDto(
                    assignment.getId(),
                    technician != null ? technician.getId() : null,
                    technician != null ? technician.getName() : null,
                    technician != null ? technician.getEmail() : null,
                    assignment.getStatus(),
                    assignment.getRejectionReason()
            );

            grouped.computeIfAbsent(ticketId, key -> new ArrayList<>()).add(dto);
        }

        for (List<AssignedTechnicianDto> technicians : grouped.values()) {
            technicians.sort(Comparator.comparing(AssignedTechnicianDto::getName,
                    Comparator.nullsLast(String::compareToIgnoreCase)));
        }

        return grouped;
    }

    private void ensureTicketOpen(Ticket ticket) {
        if (ticket.getStatus() != Ticket.Status.OPEN) {
            ticket.setStatus(Ticket.Status.OPEN);
            ticketRepository.save(ticket);
        }
    }

    private List<String> normalizeTechnicianIds(List<String> technicianIds) {
        return technicianIds.stream()
                .filter(id -> id != null && !id.trim().isEmpty())
                .map(String::trim)
                .distinct()
                .collect(Collectors.toList());
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
