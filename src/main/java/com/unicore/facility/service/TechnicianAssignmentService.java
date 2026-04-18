package com.unicore.facility.service;

import com.unicore.entity.User;
import com.unicore.facility.dto.RejectAssignmentRequest;
import com.unicore.facility.dto.TechnicianTaskResponse;
import com.unicore.facility.dto.UpdateAssignmentStatusRequest;
import com.unicore.facility.entity.TechnicianAssignment;
import com.unicore.facility.entity.Ticket;
import com.unicore.facility.exception.InvalidStatusTransitionException;
import com.unicore.facility.exception.ResourceNotFoundException;
import com.unicore.facility.exception.ValidationException;
import com.unicore.facility.repository.TechnicianAssignmentRepository;
import com.unicore.facility.repository.TicketRepository;
import com.unicore.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TechnicianAssignmentService {

    private final TechnicianAssignmentRepository technicianAssignmentRepository;
    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;

    public List<TechnicianTaskResponse> getMyTasks(String authenticatedEmail) {
        if (isBlank(authenticatedEmail) || "anonymousUser".equalsIgnoreCase(authenticatedEmail)) {
            throw new ValidationException("Authenticated technician is required.");
        }

        User technician = userRepository.findByEmail(authenticatedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found."));

        if (technician.getRole() != User.Role.TECHNICIAN && technician.getRole() != User.Role.ADMIN) {
            throw new ValidationException("Only technicians can fetch technician tasks.");
        }

        List<TechnicianAssignment> assignments = technicianAssignmentRepository.findByTechnician(technician);
        List<TechnicianTaskResponse> response = new ArrayList<>();

        for (TechnicianAssignment assignment : assignments) {
            Ticket ticket = assignment.getTicket();
            // Skip assignments where ticket no longer exists (deleted)
            if (ticket == null) {
                continue;
            }
            response.add(new TechnicianTaskResponse(
                    assignment.getId(),
                    ticket.getId(),
                    ticket.getTitle(),
                    ticket.getDescription(),
                    assignment.getAssignmentStatus(),
                    ticket.getPriority(),
                    ticket.getDeadline(),
                    ticket.getSlaStatus(),
                    ticket.getEscalated(),
                    assignment.getRejectionReason(),
                    ticket.getCreatedAt()));
        }

        response.sort(Comparator.comparing(TechnicianTaskResponse::getCreatedAt,
                Comparator.nullsLast(Comparator.reverseOrder())));
        return response;
    }

    public TechnicianAssignment acceptTask(String assignmentId) {
        TechnicianAssignment assignment = getAssignmentOrThrow(assignmentId);

        if (assignment.getAssignmentStatus() != Ticket.Status.OPEN) {
            throw new InvalidStatusTransitionException("Task can only be accepted from OPEN status.");
        }

        assignment.setAssignmentStatus(Ticket.Status.IN_PROGRESS);
        assignment.setAcceptedAt(Instant.now());
        assignment.setRejectionReason(null);
        TechnicianAssignment saved = technicianAssignmentRepository.save(assignment);
        syncTicketStatus(saved);
        return saved;
    }

    public TechnicianAssignment rejectTask(String assignmentId, RejectAssignmentRequest request) {
        TechnicianAssignment assignment = getAssignmentOrThrow(assignmentId);

        if (request == null || isBlank(request.getRejectionReason())) {
            throw new ValidationException("rejectionReason is required.");
        }

        if (assignment.getAssignmentStatus() != Ticket.Status.OPEN
                && assignment.getAssignmentStatus() != Ticket.Status.IN_PROGRESS) {
            throw new InvalidStatusTransitionException("Task can only be rejected from OPEN or IN_PROGRESS status.");
        }

        assignment.setAssignmentStatus(Ticket.Status.REJECTED);
        assignment.setRejectedAt(Instant.now());
        assignment.setRejectionReason(request.getRejectionReason().trim());
        TechnicianAssignment saved = technicianAssignmentRepository.save(assignment);
        syncTicketStatus(saved);
        return saved;
    }

    public TechnicianAssignment updateStatus(String assignmentId, UpdateAssignmentStatusRequest request) {
        TechnicianAssignment assignment = getAssignmentOrThrow(assignmentId);

        if (request == null) {
            throw new ValidationException("status is required.");
        }

        Ticket.Status targetStatus = parseStatus(request.getStatus());
        validateStatusUpdateTransition(assignment.getAssignmentStatus(), targetStatus);

        assignment.setAssignmentStatus(targetStatus);
        if (targetStatus == Ticket.Status.RESOLVED) {
            assignment.setCompletedAt(Instant.now());
        }
        assignment.setRejectionReason(null);
        TechnicianAssignment saved = technicianAssignmentRepository.save(assignment);
        syncTicketStatus(saved);
        return saved;
    }

    private TechnicianAssignment getAssignmentOrThrow(String assignmentId) {
        return technicianAssignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found."));
    }

    private Ticket.Status parseStatus(String status) {
        try {
            return Ticket.Status.valueOf(status.trim().toUpperCase());
        } catch (Exception ex) {
            throw new ValidationException("Invalid status value.");
        }
    }

    private void validateStatusUpdateTransition(Ticket.Status currentStatus, Ticket.Status targetStatus) {
        if (targetStatus == Ticket.Status.IN_PROGRESS) {
            throw new ValidationException("Use /accept endpoint to move status to IN_PROGRESS.");
        }
        if (targetStatus == Ticket.Status.REJECTED) {
            throw new ValidationException("Use /reject endpoint to move status to REJECTED.");
        }
        if (targetStatus == Ticket.Status.RESOLVED && currentStatus != Ticket.Status.IN_PROGRESS) {
            throw new InvalidStatusTransitionException("Cannot move to RESOLVED unless IN_PROGRESS.");
        }
        if (targetStatus == Ticket.Status.CLOSED && currentStatus != Ticket.Status.RESOLVED) {
            throw new InvalidStatusTransitionException("Cannot CLOSE unless RESOLVED.");
        }
        if (targetStatus != Ticket.Status.RESOLVED && targetStatus != Ticket.Status.CLOSED) {
            throw new ValidationException("Invalid status update target.");
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private void syncTicketStatus(TechnicianAssignment assignment) {
        if (assignment == null || assignment.getTicket() == null) {
            return;
        }
        Ticket ticket = assignment.getTicket();
        if (ticket.getStatus() != assignment.getAssignmentStatus()) {
            ticket.setStatus(assignment.getAssignmentStatus());
            ticket.setUpdatedAt(Instant.now());
            ticketRepository.save(ticket);
        }
    }
}
