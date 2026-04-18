package com.unicore.facility.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class AssignTechniciansRequest {

    @NotEmpty(message = "technicianIds list is required.")
    private List<String> technicianIds;
}
