package org.sport.backend.exception;

import lombok.Getter;

import java.util.Map;

@Getter
public class ValidationErrorsException extends RuntimeException {
    private final Map<String, String> errors;

    public ValidationErrorsException(Map<String, String> errors) {
        super("Validation errors occurred");
        this.errors = errors;
    }
}
