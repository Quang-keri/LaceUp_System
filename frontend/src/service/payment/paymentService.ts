import api from "../../config/axios";

class PaymentService {
  async checkout(bookingIntentId: string, paymentMethod: string) {
    const res = await api.post("/payments/checkout", {
      bookingIntentId,
      paymentMethod,
    });

    return res.data;
  }
}

export default new PaymentService();
