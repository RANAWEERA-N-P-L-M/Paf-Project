package com.unicore.facility.dto;

import lombok.Data;

@Data
public class CreateCatalogueRequest {

    private String name;

    private String type;

    private Integer capacity;

    private String location;

    private String description;

    private String status;
}
