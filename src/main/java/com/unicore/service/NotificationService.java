package com.unicore.service;

import com.unicore.entity.Notification;
import com.unicore.entity.User;
import com.unicore.repository.NotificationRepository;
import com.unicore.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public void createNotification(String recipientId, String message, Notification.Type type, String relatedEntityId) {
        Notification notification = new Notification();
        notification.setRecipientId(recipientId);
        notification.setMessage(message);
        notification.setType(type);
        notification.setRelatedEntityId(relatedEntityId);
        notification.setRead(false);
        notification.setCreatedAt(Instant.now());
        notificationRepository.save(notification);
    }

    public void notifyAllAdmins(String message, Notification.Type type, String relatedEntityId) {
        List<User> admins = userRepository.findByRole(User.Role.ADMIN);
        for (User admin : admins) {
            createNotification(admin.getId(), message, type, relatedEntityId);
        }
    }

    public List<Notification> getNotificationsForUser(String userId) {
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId);
    }

    public long getUnreadCount(String userId) {
        return notificationRepository.countByRecipientIdAndReadFalse(userId);
    }

    public void markRead(String notificationId, String userId) {
        notificationRepository.findById(notificationId).ifPresent(notification -> {
            if (userId.equals(notification.getRecipientId())) {
                notification.setRead(true);
                notificationRepository.save(notification);
            }
        });
    }

    public void markAllRead(String userId) {
        List<Notification> notifications = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId);
        notifications.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(notifications);
    }
}
