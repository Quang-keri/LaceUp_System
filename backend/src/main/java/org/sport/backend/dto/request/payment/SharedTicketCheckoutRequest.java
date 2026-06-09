package org.sport.backend.dto.request.payment;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import org.sport.backend.constant.PaymentMethod;

import java.util.UUID;

@Getter
@Setter
public class SharedTicketCheckoutRequest {

    @NotNull
    private UUID participantId;

    @NotNull
    private PaymentMethod paymentMethod;
}
