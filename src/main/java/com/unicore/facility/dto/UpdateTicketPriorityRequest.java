package com.unicore.facility.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

@Data
public class UpdateTicketPriorityRequest {

    @NotEmpty(message = "Priority is required.")
    private String priority;
}
