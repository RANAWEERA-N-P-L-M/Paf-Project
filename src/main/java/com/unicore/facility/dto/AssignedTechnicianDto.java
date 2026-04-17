package com.unicore.facility.dto;

import com.unicore.facility.entity.Ticket;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AssignedTechnicianDto {

    private String technicianId;

    private String name;

    private String email;

    private Ticket.Status assignmentStatus;
}
