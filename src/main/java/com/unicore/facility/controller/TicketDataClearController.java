package com.unicore.facility.controller;

import com.unicore.facility.service.TicketDataClearService;
import com.unicore.facility.service.TicketDataClearService.ClearDataSummary;
import com.unicore.facility.service.TicketDataClearService.TicketDataCountSummary;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Admin controller for clearing ticket data.
 * All operations are restricted to ADMIN role for security.
 */
@Slf4j
@RestController
@RequestMapping("/admin/tickets/clear")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class TicketDataClearController {

    private final TicketDataClearService ticketDataClearService;

    /**
     * Get current count of ticket data in database
     *
     * @return Current ticket data counts
     */
    @GetMapping("/count")
    public ResponseEntity<TicketDataCountSummary> getTicketDataCount() {
        log.info("Fetching ticket data count");
        return ResponseEntity.ok(ticketDataClearService.getTicketDataCount());
    }

    /**
     * Clear ALL ticket data (tickets, history, tags)
     * WARNING: This is a destructive operation!
     *
     * @return Summary of cleared data
     */
    @DeleteMapping("/all")
    public ResponseEntity<ClearDataSummary> clearAllTicketData() {
        log.warn("ADMIN: Requesting to clear ALL ticket data");
        ClearDataSummary result = ticketDataClearService.clearAllTicketData();
        if (result.isSuccess()) {
            log.warn("ADMIN: Successfully cleared ALL ticket data - Tickets: {}, History: {}, Tags: {}",
                    result.getTicketsCleared(), result.getHistoriesCleared(), result.getTagsCleared());
        }
        return ResponseEntity.ok(result);
    }

    /**
     * Clear only tickets
     *
     * @return Summary of cleared data
     */
    @DeleteMapping("/tickets")
    public ResponseEntity<ClearDataSummary> clearTickets() {
        log.warn("ADMIN: Requesting to clear tickets");
        ClearDataSummary result = ticketDataClearService.clearTickets();
        if (result.isSuccess()) {
            log.warn("ADMIN: Successfully cleared {} tickets", result.getTicketsCleared());
        }
        return ResponseEntity.ok(result);
    }

    /**
     * Clear only ticket history
     *
     * @return Summary of cleared data
     */
    @DeleteMapping("/history")
    public ResponseEntity<ClearDataSummary> clearTicketHistory() {
        log.warn("ADMIN: Requesting to clear ticket history");
        ClearDataSummary result = ticketDataClearService.clearTicketHistory();
        if (result.isSuccess()) {
            log.warn("ADMIN: Successfully cleared {} history records", result.getHistoriesCleared());
        }
        return ResponseEntity.ok(result);
    }

    /**
     * Clear only ticket tags
     *
     * @return Summary of cleared data
     */
    @DeleteMapping("/tags")
    public ResponseEntity<ClearDataSummary> clearTicketTags() {
        log.warn("ADMIN: Requesting to clear ticket tags");
        ClearDataSummary result = ticketDataClearService.clearTicketTags();
        if (result.isSuccess()) {
            log.warn("ADMIN: Successfully cleared {} tags", result.getTagsCleared());
        }
        return ResponseEntity.ok(result);
    }

    /**
     * Health check endpoint to verify controller is running
     *
     * @return Status message
     */
    @GetMapping("/status")
    public ResponseEntity<String> getStatus() {
        return ResponseEntity.ok("Ticket Data Clear Service is running");
    }
}
