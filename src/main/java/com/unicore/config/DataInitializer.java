package com.unicore.config;

import com.unicore.entity.User;
import com.unicore.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Slf4j
@Configuration
@RequiredArgsConstructor
public class DataInitializer {

    @Bean
    public CommandLineRunner initAdminUser(UserRepository userRepository,
                                           PasswordEncoder passwordEncoder) {
        return args -> {
            if (userRepository.findByEmail("admin@gmail.com").isEmpty()) {
                User admin = new User();
                admin.setName("Admin");
                admin.setEmail("admin@gmail.com");
                admin.setPassword(passwordEncoder.encode("password123"));
                admin.setRole(User.Role.ADMIN);
                admin.setProvider(User.Provider.LOCAL);
                admin.setStatus(User.Status.APPROVED);
                userRepository.save(admin);
                log.info("Default admin created: admin@gmail.com / password123");
            }
        };
    }
}
