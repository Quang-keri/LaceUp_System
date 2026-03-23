import api from "../../config/axios";

class PaymentService {
  async checkout(bookingIntentId: string, paymentMethod: string) {
    const res = await api.post("/payments/checkout", {
      bookingIntentId,
      paymentMethod,
    });

    return res.data;
  }

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

  async handleBookingPaymentResult(data: {
    orderCode: string;
    status: string;
  }) {
    const res = await api.get("/payments/result", {
      params: data,
    });
    return res;
  }
}

export default new PaymentService();
