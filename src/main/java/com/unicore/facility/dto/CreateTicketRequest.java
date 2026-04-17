package com.unicore.facility.dto;

import lombok.Data;

@Data
public class CreateTicketRequest {

    private String title;

    private String description;

    private String userId;
}
