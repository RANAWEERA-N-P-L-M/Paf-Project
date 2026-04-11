package com.unicore.controller;

import com.unicore.dto.LoginRequest;
import com.unicore.dto.LoginResponse;
import com.unicore.dto.RegisterRequest;
import com.unicore.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/oauth2/complete")
    public ResponseEntity<Map<String, String>> completeOAuth2Register(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String name = body.get("name");
        com.unicore.entity.User.Role role;
        try {
            role = com.unicore.entity.User.Role.valueOf(body.get("role"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid role."));
        }
        String message = authService.completeOAuth2Register(email, name, role);
        return ResponseEntity.ok(Map.of("message", message));
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> register(@RequestBody RegisterRequest request) {
        String message = authService.register(request);
        return ResponseEntity.ok(Map.of("message", message));
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }
}
