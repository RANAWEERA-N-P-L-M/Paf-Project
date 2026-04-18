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
 * Notification system - triggered on key events like assignment, status
 * updates, escalations
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "notifications")
public class Notification {

    @Id
    private String id;

    @DBRef
    private User recipient;

    @DBRef
    private Ticket ticket;

    private NotificationType type;

    private String title;

    private String message;

    private Boolean isRead;

    private Instant createdAt;

    private Instant readAt;

    private String relatedEntityId;

    public enum NotificationType {
        TICKET_ASSIGNED,
        TICKET_REASSIGNED,
        STATUS_UPDATED,
        TICKET_ESCALATED,
        SLA_EXPIRING,
        SLA_EXCEEDED,
        COMMENT_ADDED,
        TICKET_REJECTED
    }
}
