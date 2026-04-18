package com.unicore.facility.repository;

import com.unicore.facility.entity.Comment;
import com.unicore.facility.entity.Ticket;
import com.unicore.entity.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends MongoRepository<Comment, String> {

    List<Comment> findByTicket(Ticket ticket);

    List<Comment> findByTicketOrderByCreatedAtDesc(Ticket ticket);

    List<Comment> findByCreatedBy(User user);

    long countByTicket(Ticket ticket);
}
