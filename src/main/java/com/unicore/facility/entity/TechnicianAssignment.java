package com.unicore.facility.entity;

import com.unicore.entity.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "technician_assignments")
public class TechnicianAssignment {

    @Id
    private String id;

    @DBRef
    private Ticket ticket;

    @DBRef
    private User technician;

    private Ticket.Status status;

    private String rejectionReason;
}
