package org.sport.backend.repository;

import org.sport.backend.entity.BankAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface BankAccountRepository extends JpaRepository<BankAccount, UUID> {

    Optional<BankAccount> findByUser_UserId(UUID userId);

    Optional<BankAccount> findByAccountNumber(String accountNumber);

    boolean existsByUser_UserId(UUID userId);

    boolean existsByAccountNumber(String accountNumber);
}