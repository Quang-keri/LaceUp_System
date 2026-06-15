package org.sport.backend.dto.response.user;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import org.sport.backend.dto.response.bank.BankAccountResponse;
import org.sport.backend.dto.response.permission.PermissionResponse;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_NULL)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {

    private UUID userId;
    private String userName;
    private String email;
    private String gender;
    private String phone;
    private LocalDate dateOfBirth;
    private int age;
    private String role;
    private Set<String> permissions;
    private List<PermissionResponse> extraPermissions;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private boolean active;
    private List<CategoryRankResponse> categoryRanks;
    private Integer teamNumber;
    private Integer creditScore;
    private String memberTier;
    private BigDecimal totalSpent;
    private BigDecimal amountDue;
    private Boolean isPaid;
    private Integer playerCount;
    private UUID registrationId;
    private Boolean isCancelled;
    private String paymentStatus;
    private BankAccountResponse bankAccount;

}
