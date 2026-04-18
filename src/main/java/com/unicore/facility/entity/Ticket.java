package com.unicore.facility.entity;

import com.unicore.entity.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "tickets")
public class Ticket {

    @Id
    private String id;

    private String title;

    private String description;

    private Status status;

    private Priority priority;

    private Category category;

    private Instant createdAt;

    private Instant deadline;

    private Instant resolvedAt;

    private SlaStatus slaStatus;

    private Boolean escalated;

    @DBRef
    private User createdBy;

    @DBRef
    private User assignedTo;

    private List<String> tagIds;

    private Integer commentCount;

    private Instant updatedAt;

    public enum Status {
        OPEN,
        IN_PROGRESS,
        RESOLVED,
        CLOSED,
        REJECTED
    }

    public enum Priority {
        LOW,
        MEDIUM,
        HIGH,
        IMMEDIATE
    }

    public enum Category {
        NETWORK,
        HARDWARE,
        SOFTWARE,
        FACILITY,
        OTHER
    }

    public enum SlaStatus {
        ON_TIME,
        OVERDUE
    }
}
