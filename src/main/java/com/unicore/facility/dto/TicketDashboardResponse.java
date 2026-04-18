package com.unicore.facility.dto;

import com.unicore.facility.entity.Ticket;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TicketDashboardResponse {

    private String id;

    private String title;

    private String description;

    private Ticket.Status status;

    private Ticket.Priority priority;

    private Ticket.Category category;

    private Instant createdAt;

    private Instant deadline;

    private Ticket.SlaStatus slaStatus;

    private Boolean escalated;

    private List<AssignedTechnicianDto> assignedTechnicians;
}
