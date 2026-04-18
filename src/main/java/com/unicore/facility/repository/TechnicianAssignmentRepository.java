package com.unicore.facility.repository;

import com.unicore.entity.User;
import com.unicore.facility.entity.TechnicianAssignment;
import com.unicore.facility.entity.Ticket;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface TechnicianAssignmentRepository extends MongoRepository<TechnicianAssignment, String> {

    List<TechnicianAssignment> findByTicket(Ticket ticket);

    List<TechnicianAssignment> findByTicketIn(List<Ticket> tickets);

    List<TechnicianAssignment> findByTechnician(User technician);
}
