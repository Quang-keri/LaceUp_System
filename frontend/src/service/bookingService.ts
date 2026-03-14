import api from "../config/axios";
class BookingService {
  async createBooking(data: any) {
    const res = await api.post("/bookings/intent", data);
    return res.data;
  }

  async getBookingIntent(bookingIntentId: string) {
    const res = await api.get(`/bookings/intent/${bookingIntentId}`);
    return res.data.result;
  }
}

export default new BookingService();
