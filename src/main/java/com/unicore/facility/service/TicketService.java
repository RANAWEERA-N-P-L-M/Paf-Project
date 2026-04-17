package com.unicore.facility.service;

import com.unicore.entity.User;
import com.unicore.facility.dto.CreateTicketRequest;
import com.unicore.facility.entity.Ticket;
import com.unicore.facility.repository.TicketRepository;
import com.unicore.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class TicketService {

    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;

    public Ticket createTicket(CreateTicketRequest request, String authenticatedEmail) {
        validateRequest(request);

        User createdBy = resolveCreatedBy(request, authenticatedEmail);

        Ticket ticket = new Ticket();
        ticket.setTitle(request.getTitle().trim());
        ticket.setDescription(request.getDescription().trim());
        ticket.setStatus(Ticket.Status.OPEN);
        ticket.setCreatedAt(Instant.now());
        ticket.setCreatedBy(createdBy);

        return ticketRepository.save(ticket);
    }

    private User resolveCreatedBy(CreateTicketRequest request, String authenticatedEmail) {
        if (!isBlank(authenticatedEmail) && !"anonymousUser".equalsIgnoreCase(authenticatedEmail)) {
            return userRepository.findByEmail(authenticatedEmail)
                    .orElseThrow(() -> new RuntimeException("Authenticated user not found."));
        }

        if (!isBlank(request.getUserId())) {
            return userRepository.findById(request.getUserId().trim())
                    .orElseThrow(() -> new RuntimeException("User not found for given userId."));
        }

        throw new RuntimeException("Unable to resolve ticket creator. Authenticate or provide userId.");
    }

    private void validateRequest(CreateTicketRequest request) {
        if (request == null) {
            throw new RuntimeException("Request body is required.");
        }
        if (isBlank(request.getTitle())) {
            throw new RuntimeException("Title is required.");
        }
        if (isBlank(request.getDescription())) {
            throw new RuntimeException("Description is required.");
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
