package com.unicore.facility.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateTicketRequest {

    @NotBlank(message = "Title is required.")
    @Size(max = 120, message = "Title must be at most 120 characters.")
    private String title;

    @NotBlank(message = "Description is required.")
    @Size(max = 2000, message = "Description must be at most 2000 characters.")
    private String description;

    private String userId;
}
