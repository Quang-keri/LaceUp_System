import api from "../../config/axios";

class PaymentService {
  async checkoutPayment(
    bookingIntentId: string,
    paymentMethod: string,
    isDeposit: boolean,
  ) {
    const res = await api.post("/payments/checkout-payment", {
      bookingIntentId,
      paymentMethod,
      isDeposit: isDeposit,
    });
    return res.data;
  }

  async checkoutMatchJoin(registrationId: string, paymentMethod: string) {
    const res = await api.post("/payments/checkout-match", {
      registrationId,
      paymentMethod,
    });
    return res.data;
  }

  async handleBookingPaymentResult(data: {
    orderCode: string;
    status: string;
  }) {
    return await api.get("/payments/result", {
      params: data,
    });
  }

  async handleVnPayReturn(queryString: string) {
    return await api.get(`/payments/vnpay/return${queryString}`);
  }

  async getMatchPayments(params: {
    status: string;
    keyword?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const res = await api.get("/payments/owner/match-payments", { params });
    return res.data;
  }

  async confirmMatchPayment(paymentId: string, isApproved: boolean) {
    const res = await api.post(
      `/payments/owner/confirm-match-payment/${paymentId}`,
      null,
      {
        params: { isApproved },
      },
    );
    return res.data;
  }
}

export default new PaymentService();
