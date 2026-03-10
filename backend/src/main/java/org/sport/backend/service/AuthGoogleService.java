package org.sport.backend.service;

import org.sport.backend.dto.response.auth.LoginGoogleResponse;

public interface AuthGoogleService {
    LoginGoogleResponse authenticate(String code);
}

