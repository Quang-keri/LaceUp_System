package org.sport.backend.service;

import jakarta.servlet.http.HttpServletRequest;
import org.sport.backend.dto.request.auth.LoginRequest;
import org.sport.backend.dto.response.auth.LoginResponse;


public interface AuthService {

    LoginResponse login(LoginRequest loginRequest);

//    LoginResponse refresh(HttpServletRequest refreshRequest);

    LoginResponse loginWithGoogle(String email, String name, String googleId);
}
