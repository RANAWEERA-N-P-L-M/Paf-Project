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
 * Comments on tickets - can be added by users, technicians, and admins
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "ticket_comments")
public class Comment {

    @Id
    private String id;

    @DBRef
    private Ticket ticket;

    @DBRef
    private User createdBy;

    private String content;

    private Instant createdAt;

    private Instant updatedAt;

    private CommentType type;

    public enum CommentType {
        USER_COMMENT,
        ADMIN_NOTE,
        TECHNICIAN_NOTE,
        SYSTEM_UPDATE
    }
}
