package org.sport.backend.constant;

public enum AccountDeletionStatus {
    NONE,
    REQUESTED,
    WAITING_FOR_OBLIGATIONS,
    PROCESSING,
    COMPLETED,
    CANCELLED
}