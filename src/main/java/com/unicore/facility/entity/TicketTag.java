package com.unicore.facility.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * Tags/categories for tickets - allows for flexible categorization beyond the
 * fixed Category enum
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "ticket_tags")
public class TicketTag {

    @Id
    private String id;

    private String name;

    private String description;

    private String color;

    private Integer usageCount;

    private Instant createdAt;

    private Boolean isActive;
}
