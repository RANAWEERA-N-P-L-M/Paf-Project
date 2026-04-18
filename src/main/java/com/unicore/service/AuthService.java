package com.unicore.service;

import com.unicore.auth.JwtUtil;
import com.unicore.dto.LoginRequest;
import com.unicore.dto.LoginResponse;
import com.unicore.dto.RegisterRequest;
import com.unicore.entity.Notification;
import com.unicore.entity.User;
import com.unicore.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final NotificationService notificationService;

    public String register(RegisterRequest request) {
        if (request.getRole() == null || request.getRole() == User.Role.ADMIN) {
            throw new RuntimeException("Invalid role. Only USER or TECHNICIAN allowed.");
        }

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email is already registered.");
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole());
        user.setProvider(User.Provider.LOCAL);
        // Technicians require admin approval; regular users are auto-approved
        if (request.getRole() == User.Role.TECHNICIAN) {
            user.setStatus(User.Status.PENDING);
        } else {
            user.setStatus(User.Status.APPROVED);
        }

        User saved = userRepository.save(user);
        if (request.getRole() == User.Role.TECHNICIAN) {
            notificationService.notifyAllAdmins(
                    "New technician registration pending approval: " + saved.getName() + " (" + saved.getEmail() + ")",
                    Notification.Type.USER,
                    saved.getId()
            );
            return "Registration successful. Await admin approval.";
        }
        return "Registration successful. You can now login.";
    }

    public Map<String, String> completeOAuth2Register(String email, String name, User.Role role) {
        if (role == null || role == User.Role.ADMIN) {
            throw new RuntimeException("Invalid role. Only USER or TECHNICIAN allowed.");
        }
        if (userRepository.findByEmail(email).isPresent()) {
            throw new RuntimeException("Email is already registered.");
        }
        User user = new User();
        user.setEmail(email);
        user.setName(name);
        user.setRole(role);
        user.setProvider(User.Provider.GOOGLE);
        if (role == User.Role.TECHNICIAN) {
            user.setStatus(User.Status.PENDING);
            User saved = userRepository.save(user);
            notificationService.notifyAllAdmins(
                    "New technician registration pending approval: " + saved.getName() + " (" + saved.getEmail() + ")",
                    Notification.Type.USER,
                    saved.getId()
            );
            return Map.of("message", "Registration submitted. Waiting for admin approval.");
        } else {
            user.setStatus(User.Status.APPROVED);
            userRepository.save(user);
            String token = jwtUtil.generateToken(email, role.name());
            return Map.of("token", token, "role", role.name(), "email", email);
        }
    }

    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password."));

        if (user.getPassword() == null || !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid email or password.");
        }

        switch (user.getStatus()) {
            case PENDING -> throw new RuntimeException("Account not approved yet. Please wait for admin approval.");
            case REJECTED -> throw new RuntimeException("Account has been rejected. Contact the administrator.");
            default -> { /* APPROVED — continue */ }
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        return new LoginResponse(token, user.getRole().name(), user.getEmail());
    }
}
