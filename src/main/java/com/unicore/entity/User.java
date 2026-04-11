package com.unicore.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "users")
public class User {

    @Id
    private String id;

    private String name;

    @Indexed(unique = true)
    private String email;

    @JsonIgnore
    private String password;

    private Role role;

    private Provider provider;

    private Status status;

    public enum Role {
        ADMIN, USER, TECHNICIAN
    }

    public enum Provider {
        LOCAL, GOOGLE
    }

    public enum Status {
        PENDING, APPROVED, REJECTED
    }
}
