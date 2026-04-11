package com.unicore.admin.controller;

import com.unicore.admin.service.AdminService;
import com.unicore.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(adminService.getAllUsers());
    }

    @PutMapping("/users/{id}/approve")
    public ResponseEntity<User> approveUser(@PathVariable String id) {
        return ResponseEntity.ok(adminService.approveUser(id));
    }

    @PutMapping("/users/{id}/reject")
    public ResponseEntity<User> rejectUser(@PathVariable String id) {
        return ResponseEntity.ok(adminService.rejectUser(id));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Map<String, String>> deleteUser(@PathVariable String id) {
        adminService.deleteUser(id);
        return ResponseEntity.ok(Map.of("message", "User deleted successfully."));
    }

    @PutMapping("/users/{id}/reset-password")
    public ResponseEntity<User> resetPassword(@PathVariable String id,
                                               @RequestBody Map<String, String> body) {
        String newPassword = body.get("password");
        if (newPassword == null || newPassword.isBlank()) {
            throw new RuntimeException("New password must not be empty.");
        }
        return ResponseEntity.ok(adminService.resetPassword(id, newPassword));
    }
}
