package com.unicore.facility.dto;

import lombok.Data;

import java.util.List;

@Data
public class AssignTechniciansRequest {

    private List<String> technicianIds;
}
