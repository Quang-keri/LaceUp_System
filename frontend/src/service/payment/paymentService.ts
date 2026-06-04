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
}

export default new PaymentService();
