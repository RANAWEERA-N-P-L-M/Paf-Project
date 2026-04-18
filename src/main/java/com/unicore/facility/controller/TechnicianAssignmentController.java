package com.unicore.facility.controller;

import com.unicore.facility.dto.RejectAssignmentRequest;
import com.unicore.facility.dto.TechnicianTaskResponse;
import com.unicore.facility.dto.UpdateAssignmentStatusRequest;
import com.unicore.facility.entity.TechnicianAssignment;
import com.unicore.facility.service.TechnicianAssignmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/assignments")
@RequiredArgsConstructor
public class TechnicianAssignmentController {

    private final TechnicianAssignmentService technicianAssignmentService;

    @GetMapping("/my")
    @PreAuthorize("hasAnyRole('TECHNICIAN','ADMIN')")
    public ResponseEntity<List<TechnicianTaskResponse>> getMyTasks(Authentication authentication) {
        String authenticatedEmail = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(technicianAssignmentService.getMyTasks(authenticatedEmail));
    }

    @PutMapping("/{id}/accept")
    @PreAuthorize("hasAnyRole('TECHNICIAN','ADMIN')")
    public ResponseEntity<TechnicianAssignment> acceptTask(@PathVariable("id") String assignmentId) {
        return ResponseEntity.ok(technicianAssignmentService.acceptTask(assignmentId));
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('TECHNICIAN','ADMIN')")
    public ResponseEntity<TechnicianAssignment> rejectTask(@PathVariable("id") String assignmentId,
                                                           @Valid @RequestBody RejectAssignmentRequest request) {
        return ResponseEntity.ok(technicianAssignmentService.rejectTask(assignmentId, request));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('TECHNICIAN','ADMIN')")
    public ResponseEntity<TechnicianAssignment> updateStatus(@PathVariable("id") String assignmentId,
                                                             @Valid @RequestBody UpdateAssignmentStatusRequest request) {
        return ResponseEntity.ok(technicianAssignmentService.updateStatus(assignmentId, request));
    }
}
