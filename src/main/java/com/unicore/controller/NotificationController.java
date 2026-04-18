package com.unicore.controller;

import com.unicore.entity.Notification;
import com.unicore.entity.User;
import com.unicore.repository.UserRepository;
import com.unicore.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Notification>> getMyNotifications(Principal principal) {
        User user = resolveUser(principal);
        return ResponseEntity.ok(notificationService.getNotificationsForUser(user.getId()));
    }

    @GetMapping("/unread-count")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Long>> getUnreadCount(Principal principal) {
        User user = resolveUser(principal);
        long count = notificationService.getUnreadCount(user.getId());
        return ResponseEntity.ok(Map.of("count", count));
    }

    @PutMapping("/{id}/read")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> markRead(@PathVariable String id, Principal principal) {
        User user = resolveUser(principal);
        notificationService.markRead(id, user.getId());
        return ResponseEntity.ok().build();
    }

    @PutMapping("/read-all")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> markAllRead(Principal principal) {
        User user = resolveUser(principal);
        notificationService.markAllRead(user.getId());
        return ResponseEntity.ok().build();
    }

    private User resolveUser(Principal principal) {
        return userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found."));
    }
}
