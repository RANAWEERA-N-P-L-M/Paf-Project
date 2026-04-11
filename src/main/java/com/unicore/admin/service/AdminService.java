package com.unicore.admin.service;

import com.unicore.entity.User;
import com.unicore.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User approveUser(String id) {
        User user = findUserById(id);
        user.setStatus(User.Status.APPROVED);
        return userRepository.save(user);
    }

    public User rejectUser(String id) {
        User user = findUserById(id);
        user.setStatus(User.Status.REJECTED);
        return userRepository.save(user);
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
