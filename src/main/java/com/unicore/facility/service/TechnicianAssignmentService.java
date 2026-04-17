package com.unicore.facility.service;

import com.unicore.facility.dto.RejectAssignmentRequest;
import com.unicore.facility.dto.UpdateAssignmentStatusRequest;
import com.unicore.facility.entity.TechnicianAssignment;
import com.unicore.facility.entity.Ticket;
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
            throw new RuntimeException("Task can only be accepted from OPEN status.");
        }

        assignment.setStatus(Ticket.Status.IN_PROGRESS);
        assignment.setRejectionReason(null);
        return technicianAssignmentRepository.save(assignment);
    }

    public TechnicianAssignment rejectTask(String assignmentId, RejectAssignmentRequest request) {
        TechnicianAssignment assignment = getAssignmentOrThrow(assignmentId);

        if (request == null || isBlank(request.getRejectionReason())) {
            throw new RuntimeException("rejectionReason is required.");
        }

        if (assignment.getStatus() != Ticket.Status.OPEN && assignment.getStatus() != Ticket.Status.IN_PROGRESS) {
            throw new RuntimeException("Task can only be rejected from OPEN or IN_PROGRESS status.");
        }

        assignment.setStatus(Ticket.Status.REJECTED);
        assignment.setRejectionReason(request.getRejectionReason().trim());
        return technicianAssignmentRepository.save(assignment);
    }

    public TechnicianAssignment updateStatus(String assignmentId, UpdateAssignmentStatusRequest request) {
        TechnicianAssignment assignment = getAssignmentOrThrow(assignmentId);

        if (request == null || isBlank(request.getStatus())) {
            throw new RuntimeException("status is required.");
        }

        Ticket.Status targetStatus = parseStatus(request.getStatus());
        Ticket.Status currentStatus = assignment.getStatus();

        if (targetStatus == Ticket.Status.IN_PROGRESS) {
            throw new RuntimeException("Use /accept endpoint to move status to IN_PROGRESS.");
        }
        if (targetStatus == Ticket.Status.REJECTED) {
            throw new RuntimeException("Use /reject endpoint to move status to REJECTED.");
        }

        boolean isValidTransition =
                (currentStatus == Ticket.Status.IN_PROGRESS && targetStatus == Ticket.Status.RESOLVED)
                        || (currentStatus == Ticket.Status.RESOLVED && targetStatus == Ticket.Status.CLOSED);

        if (!isValidTransition) {
            throw new RuntimeException("Invalid status transition. Allowed transitions: IN_PROGRESS -> RESOLVED -> CLOSED.");
        }

        assignment.setStatus(targetStatus);
        if (targetStatus != Ticket.Status.REJECTED) {
            assignment.setRejectionReason(null);
        }
        return technicianAssignmentRepository.save(assignment);
    }

    private TechnicianAssignment getAssignmentOrThrow(String assignmentId) {
        return technicianAssignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found."));
    }

    private Ticket.Status parseStatus(String status) {
        try {
            return Ticket.Status.valueOf(status.trim().toUpperCase());
        } catch (Exception ex) {
            throw new RuntimeException("Invalid status value.");
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
