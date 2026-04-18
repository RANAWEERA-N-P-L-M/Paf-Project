package com.unicore.facility.entity;

import com.unicore.entity.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * Tracks all changes to a ticket: creation, status updates, assignments,
 * rejections, escalations
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "ticket_history")
public class TicketHistory {

    @Id
    private String id;

    @DBRef
    private Ticket ticket;

    private ActionType actionType;

    private String description;

    private String oldValue;

    private String newValue;

    @DBRef
    private User performedBy;

    private Instant performedAt;

    private String metadata;

    public enum ActionType {
        CREATED,
        ASSIGNED,
        STATUS_CHANGED,
        PRIORITY_CHANGED,
        REJECTED,
        ESCALATED,
        REASSIGNED,
        CATEGORY_CHANGED,
        DEADLINE_EXTENDED
    }
}
