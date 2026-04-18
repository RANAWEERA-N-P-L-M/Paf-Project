package com.unicore.facility.service;

import com.unicore.facility.repository.TicketRepository;
import com.unicore.facility.repository.TicketHistoryRepository;
import com.unicore.facility.repository.TicketTagRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * Service to clear ticket-related data from MongoDB database.
 * This service provides methods to clear ticket data, history, and tags.
 */
@Slf4j
@Service
public class TicketDataClearService {

    @Autowired
    private TicketRepository ticketRepository;

    @Autowired
    private TicketHistoryRepository ticketHistoryRepository;

    @Autowired
    private TicketTagRepository ticketTagRepository;

    /**
     * Clear all ticket-related data from the database.
     * This includes tickets, ticket history, and ticket tags.
     *
     * @return Summary of cleared data
     */
    public ClearDataSummary clearAllTicketData() {
        log.warn("Starting to clear ALL ticket data from database...");

        long ticketsDeleted = 0;
        long historiesDeleted = 0;
        long tagsDeleted = 0;

        try {
            // Clear ticket history first (references tickets)
            historiesDeleted = ticketHistoryRepository.count();
            ticketHistoryRepository.deleteAll();
            log.info("Cleared {} ticket history records", historiesDeleted);

            // Clear tickets
            ticketsDeleted = ticketRepository.count();
            ticketRepository.deleteAll();
            log.info("Cleared {} tickets", ticketsDeleted);

            // Clear ticket tags
            tagsDeleted = ticketTagRepository.count();
            ticketTagRepository.deleteAll();
            log.info("Cleared {} ticket tags", tagsDeleted);

            log.info("Successfully cleared all ticket data");

            return ClearDataSummary.builder()
                    .ticketsCleared(ticketsDeleted)
                    .historiesCleared(historiesDeleted)
                    .tagsCleared(tagsDeleted)
                    .totalCleared(ticketsDeleted + historiesDeleted + tagsDeleted)
                    .success(true)
                    .message("All ticket data cleared successfully")
                    .build();

        } catch (Exception e) {
            log.error("Error clearing ticket data", e);
            return ClearDataSummary.builder()
                    .success(false)
                    .message("Error clearing data: " + e.getMessage())
                    .build();
        }
    }

    /**
     * Clear only tickets (not history or tags).
     *
     * @return Summary of cleared data
     */
    public ClearDataSummary clearTickets() {
        log.warn("Starting to clear tickets from database...");

        try {
            long count = ticketRepository.count();
            ticketRepository.deleteAll();
            log.info("Cleared {} tickets", count);

            return ClearDataSummary.builder()
                    .ticketsCleared(count)
                    .success(true)
                    .message("Tickets cleared successfully")
                    .build();

        } catch (Exception e) {
            log.error("Error clearing tickets", e);
            return ClearDataSummary.builder()
                    .success(false)
                    .message("Error clearing tickets: " + e.getMessage())
                    .build();
        }
    }

    /**
     * Clear only ticket history.
     *
     * @return Summary of cleared data
     */
    public ClearDataSummary clearTicketHistory() {
        log.warn("Starting to clear ticket history from database...");

        try {
            long count = ticketHistoryRepository.count();
            ticketHistoryRepository.deleteAll();
            log.info("Cleared {} ticket history records", count);

            return ClearDataSummary.builder()
                    .historiesCleared(count)
                    .success(true)
                    .message("Ticket history cleared successfully")
                    .build();

        } catch (Exception e) {
            log.error("Error clearing ticket history", e);
            return ClearDataSummary.builder()
                    .success(false)
                    .message("Error clearing ticket history: " + e.getMessage())
                    .build();
        }
    }

    /**
     * Clear only ticket tags.
     *
     * @return Summary of cleared data
     */
    public ClearDataSummary clearTicketTags() {
        log.warn("Starting to clear ticket tags from database...");

        try {
            long count = ticketTagRepository.count();
            ticketTagRepository.deleteAll();
            log.info("Cleared {} ticket tags", count);

            return ClearDataSummary.builder()
                    .tagsCleared(count)
                    .success(true)
                    .message("Ticket tags cleared successfully")
                    .build();

        } catch (Exception e) {
            log.error("Error clearing ticket tags", e);
            return ClearDataSummary.builder()
                    .success(false)
                    .message("Error clearing ticket tags: " + e.getMessage())
                    .build();
        }
    }

    /**
     * Get current count of ticket data
     */
    public TicketDataCountSummary getTicketDataCount() {
        return TicketDataCountSummary.builder()
                .ticketCount(ticketRepository.count())
                .historyCount(ticketHistoryRepository.count())
                .tagCount(ticketTagRepository.count())
                .build();
    }

    // DTO Classes

    /**
     * Summary of cleared data
     */
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class ClearDataSummary {
        private long ticketsCleared;
        private long historiesCleared;
        private long tagsCleared;
        private long totalCleared;
        private boolean success;
        private String message;
    }

    /**
     * Summary of ticket data counts
     */
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class TicketDataCountSummary {
        private long ticketCount;
        private long historyCount;
        private long tagCount;
    }
}
