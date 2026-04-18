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

    private Instant createdAt;

    private List<AssignedTechnicianDto> assignedTechnicians;
}
