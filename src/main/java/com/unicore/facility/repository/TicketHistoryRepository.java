package com.unicore.facility.repository;

import com.unicore.facility.entity.TicketHistory;
import com.unicore.facility.entity.Ticket;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface TicketHistoryRepository extends MongoRepository<TicketHistory, String> {

    List<TicketHistory> findByTicket(Ticket ticket);

    List<TicketHistory> findByTicketOrderByPerformedAtDesc(Ticket ticket);

    List<TicketHistory> findByTicketAndPerformedAtBetween(Ticket ticket, Instant startTime, Instant endTime);

    List<TicketHistory> findByActionType(TicketHistory.ActionType actionType);
}
