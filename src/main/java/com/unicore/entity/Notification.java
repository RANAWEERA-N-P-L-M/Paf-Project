package com.unicore.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "notifications")
public class Notification {

    @Id
    private String id;

    private String recipientId;

    private String message;

    private Type type;

    private String relatedEntityId;

    private boolean read;

    private Instant createdAt;

    public enum Type {
        BOOKING, TICKET, ASSIGNMENT, USER
    }
}
