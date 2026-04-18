package com.unicore.facility.repository;

import com.unicore.facility.entity.TicketTag;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TicketTagRepository extends MongoRepository<TicketTag, String> {

    Optional<TicketTag> findByName(String name);

    List<TicketTag> findByIsActive(Boolean isActive);

    List<TicketTag> findByIsActiveTrueOrderByUsageCountDesc();
}
