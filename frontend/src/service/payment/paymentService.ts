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

export async function handleBookingPaymentResult(data: {
  orderCode: string;
  status: string;
}) {
  const res = await api.get("/payments/result", {
    params: data,
  });
  return res;
}

export default new PaymentService();
