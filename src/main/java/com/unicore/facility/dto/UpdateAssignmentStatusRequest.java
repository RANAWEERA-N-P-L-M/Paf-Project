package com.unicore.facility.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateAssignmentStatusRequest {

    @NotBlank(message = "status is required.")
    private String status;
}
