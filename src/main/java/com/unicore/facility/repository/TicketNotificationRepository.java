package com.unicore.facility.repository;

import com.unicore.facility.entity.Notification;
import com.unicore.entity.User;
import com.unicore.facility.entity.Ticket;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketNotificationRepository extends MongoRepository<Notification, String> {

    List<Notification> findByRecipient(User recipient);

    List<Notification> findByRecipientOrderByCreatedAtDesc(User recipient);

    List<Notification> findByRecipientAndIsReadFalseOrderByCreatedAtDesc(User recipient);

    List<Notification> findByTicket(Ticket ticket);

    long countByRecipientAndIsReadFalse(User recipient);

    List<Notification> findByType(Notification.NotificationType type);
}
