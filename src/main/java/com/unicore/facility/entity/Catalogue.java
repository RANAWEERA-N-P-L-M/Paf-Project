package com.unicore.facility.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "catalogues")
public class Catalogue {

    @Id
    private String id;

    private String name;

    private String type;

    private String capacity;

    private String location;

    private List<String> equipments;

    private String description;

    private Status status;

    private Instant createdAt;

    public enum Status {
        ACTIVE,
        OUT_OF_SERVICE
    }
}
