package org.sport.backend.dto.response.user;


import org.sport.backend.constant.AccountDeletionStatus;

import java.util.List;



import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeleteAccountResponse {

    private AccountDeletionStatus status;

    private String message;

    private List<String> blockers;
}
