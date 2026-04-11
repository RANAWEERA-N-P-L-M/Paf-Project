package com.unicore.dto;

import com.unicore.entity.User;
import lombok.Data;

@Data
public class RegisterRequest {
    private String name;
    private String email;
    private String password;
    private User.Role role;
}
