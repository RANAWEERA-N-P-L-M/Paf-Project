package com.unicore.facility.dto;

import lombok.Data;

import java.util.List;

@Data
public class CreateCatalogueRequest {

    private String name;

    private String type;

    private String capacity;

    private String location;

    private List<String> equipments;

    private String description;

    private String status;
}
