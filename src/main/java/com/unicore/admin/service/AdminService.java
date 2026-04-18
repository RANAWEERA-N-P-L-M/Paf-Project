package com.unicore.admin.service;

import com.unicore.entity.Notification;
import com.unicore.entity.User;
import com.unicore.repository.UserRepository;
import com.unicore.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final NotificationService notificationService;

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User approveUser(String id) {
        User user = findUserById(id);
        user.setStatus(User.Status.APPROVED);
        User saved = userRepository.save(user);
        notificationService.createNotification(
                saved.getId(),
                "Your account has been approved. You can now log in.",
                Notification.Type.USER,
                saved.getId()
        );
        return saved;
    }

    public User rejectUser(String id) {
        User user = findUserById(id);
        user.setStatus(User.Status.REJECTED);
        User saved = userRepository.save(user);
        notificationService.createNotification(
                saved.getId(),
                "Your account registration has been rejected. Please contact the administrator.",
                Notification.Type.USER,
                saved.getId()
        );
        return saved;
    }

    public void deleteUser(String id) {
        if (!userRepository.existsById(id)) {
            throw new RuntimeException("User not found.");
        }
        userRepository.deleteById(id);
    }

    public User resetPassword(String id, String newPassword) {
        User user = findUserById(id);
        user.setPassword(passwordEncoder.encode(newPassword));
        return userRepository.save(user);
    }

    private User findUserById(String id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found."));
    }
}
