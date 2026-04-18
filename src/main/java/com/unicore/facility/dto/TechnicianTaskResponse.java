package com.unicore.facility.dto;

import com.unicore.facility.entity.Ticket;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TechnicianTaskResponse {

    private String assignmentId;

    private String ticketId;

    private String ticketTitle;

    private String ticketDescription;

    private Ticket.Status status;

    private Ticket.Priority priority;

    private Instant deadline;

    private Ticket.SlaStatus slaStatus;

    private Boolean escalated;

    private String rejectionReason;

    private Instant createdAt;
}

