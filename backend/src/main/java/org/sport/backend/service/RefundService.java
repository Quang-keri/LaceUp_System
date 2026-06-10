package org.sport.backend.service;

import org.sport.backend.dto.base.PageResponse;
import org.sport.backend.dto.request.payment.ProcessRefundRequest;
import org.sport.backend.dto.response.payment.RefundResponse;

import java.util.UUID;

public interface RefundService {

    PageResponse<RefundResponse> getAdminPendingRefunds(
            int page,
            int size
    );

    PageResponse<RefundResponse> getAdminCompletedRefunds(
            int page,
            int size
    );

    void processAdminRefund(
            UUID paymentId,
            ProcessRefundRequest request
    );

    PageResponse<RefundResponse> getOwnerPendingRefunds(
            UUID rentalAreaId,
            int page,
            int size
    );

    PageResponse<RefundResponse> getOwnerCompletedRefunds(
            UUID rentalAreaId,
            int page,
            int size
    );

    void processOwnerRefund(
            UUID paymentId,
            ProcessRefundRequest request
    );
}