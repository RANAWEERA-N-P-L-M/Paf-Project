package com.unicore.auth;

import com.unicore.entity.User;
import com.unicore.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    @Value("${app.frontend-base-url:http://localhost:5173}")
    private String frontendBaseUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {

        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");

        Optional<User> existingUser = userRepository.findByEmail(email);
        User user;

        if (existingUser.isEmpty()) {
            // New Google user — ask them to pick a role before creating account
            String encodedEmail = URLEncoder.encode(email, StandardCharsets.UTF_8);
            String encodedName = URLEncoder.encode(name != null ? name : "", StandardCharsets.UTF_8);
            response.sendRedirect(
                frontendBaseUrl + "/oauth-success?action=select-role&email=" + encodedEmail + "&name=" + encodedName
            );
            return;
        }

        user = existingUser.get();

        if (user.getStatus() == User.Status.PENDING) {
            response.sendRedirect(frontendBaseUrl + "/oauth-success?error=pending");
            return;
        }

        if (user.getStatus() == User.Status.REJECTED) {
            response.sendRedirect(frontendBaseUrl + "/oauth-success?error=rejected");
            return;
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        String role = user.getRole().name();
        response.sendRedirect(
            frontendBaseUrl + "/oauth-success?token=" + token + "&role=" + role
        );
    }
}
