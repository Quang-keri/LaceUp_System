package org.sport.backend.service;

import jakarta.servlet.http.HttpServletRequest;


public interface AuthService {

    LoginResponse login(LoginRequest loginRequest);

    LoginResponse refresh(HttpServletRequest refreshRequest);

    LoginResponse loginWithGoogle(String email, String name, String googleId);
}
