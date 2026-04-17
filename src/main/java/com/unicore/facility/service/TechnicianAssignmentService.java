package com.unicore.facility.service;

import com.unicore.facility.dto.RejectAssignmentRequest;
import com.unicore.facility.dto.UpdateAssignmentStatusRequest;
import com.unicore.facility.entity.TechnicianAssignment;
import com.unicore.facility.entity.Ticket;
import com.unicore.facility.exception.InvalidStatusTransitionException;
import com.unicore.facility.exception.ResourceNotFoundException;
import com.unicore.facility.exception.ValidationException;
import com.unicore.facility.repository.TechnicianAssignmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TechnicianAssignmentService {

    private final TechnicianAssignmentRepository technicianAssignmentRepository;

    public TechnicianAssignment acceptTask(String assignmentId) {
        TechnicianAssignment assignment = getAssignmentOrThrow(assignmentId);

        if (assignment.getStatus() != Ticket.Status.OPEN) {
            throw new InvalidStatusTransitionException("Task can only be accepted from OPEN status.");
        }

        assignment.setStatus(Ticket.Status.IN_PROGRESS);
        assignment.setRejectionReason(null);
        return technicianAssignmentRepository.save(assignment);
    }

    public TechnicianAssignment rejectTask(String assignmentId, RejectAssignmentRequest request) {
        TechnicianAssignment assignment = getAssignmentOrThrow(assignmentId);

        if (request == null || isBlank(request.getRejectionReason())) {
            throw new ValidationException("rejectionReason is required.");
        }

        if (assignment.getStatus() != Ticket.Status.OPEN && assignment.getStatus() != Ticket.Status.IN_PROGRESS) {
            throw new InvalidStatusTransitionException("Task can only be rejected from OPEN or IN_PROGRESS status.");
        }

        assignment.setStatus(Ticket.Status.REJECTED);
        assignment.setRejectionReason(request.getRejectionReason().trim());
        return technicianAssignmentRepository.save(assignment);
    }

    public TechnicianAssignment updateStatus(String assignmentId, UpdateAssignmentStatusRequest request) {
        TechnicianAssignment assignment = getAssignmentOrThrow(assignmentId);

        if (request == null || isBlank(request.getStatus())) {
            throw new ValidationException("status is required.");
        }

        Ticket.Status targetStatus = parseStatus(request.getStatus());
        Ticket.Status currentStatus = assignment.getStatus();

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

        assignment.setStatus(targetStatus);
        if (targetStatus != Ticket.Status.REJECTED) {
            assignment.setRejectionReason(null);
        }
        return technicianAssignmentRepository.save(assignment);
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

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
