package com.unicore.facility.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RejectAssignmentRequest {

    @NotBlank(message = "rejectionReason is required.")
    @Size(max = 1000, message = "rejectionReason must be at most 1000 characters.")
    private String rejectionReason;
}
