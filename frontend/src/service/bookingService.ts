import api from "../config/axios";
import type { BookingListResponse, BookingResponse } from "../types/booking";
import type { ApiResponse } from "../types/ApiResponse";

class BookingService {
  async createBooking(data: any) {
    const res = await api.post("/bookings/intent", data);
    return res.data;
  }

  async getBookingIntent(bookingIntentId: string) {
    const res = await api.get(`/bookings/intent/${bookingIntentId}`);
    return res.data.result;
  }

  async getBookingsByRentalArea(
    rentalAreaId: string,
    page: number = 1,
    size: number = 10,
    status?: string,
  ) {
    const params = new URLSearchParams();

    params.append("rentalId", rentalAreaId);
    params.append("page", page.toString());
    params.append("size", size.toString());

    if (status) params.append("status", status);

    const response = await api.get<ApiResponse<BookingListResponse>>(
      `/bookings/my-rentals?${params.toString()}`,
    );

    return response.data;
  }

  async getMyBookings(
    userId: string,
    page: number = 1,
    size: number = 10,
    status?: string,
  ) {
    const params = new URLSearchParams();
    params.append("userId", userId);
    params.append("page", page.toString());
    params.append("size", size.toString());
    if (status) params.append("status", status);

    const response = await api.get<ApiResponse<BookingListResponse>>(
      `/bookings/my-bookings?${params.toString()}`,
    );
    return response.data;
  }

  async updateBooking(bookingId: string, payload: any) {
    const response = await api.put<ApiResponse<BookingResponse>>(
      `/bookings/${bookingId}`,
      payload,
    );
    return response.data;
  }

  async getBookingById(bookingId: string) {
    const response = await api.get<ApiResponse<BookingResponse>>(
      `/bookings/${bookingId}`,
    );
    return response.data;
  }

  async cancelBooking(bookingId: string) {
    const response = await api.delete<ApiResponse<void>>(
      `/bookings/${bookingId}`,
    );
    return response.data;
  }

  async getAllBookings(
    page: number = 1,
    size: number = 10,
    status?: string,
    keyword?: string,
    from?: string,
    to?: string,
  ) {
    const params = new URLSearchParams();

    params.append("page", page.toString());
    params.append("size", size.toString());

    if (status) params.append("bookingStatus", status);
    if (keyword) params.append("keyword", keyword);
    if (from) params.append("from", from);
    if (to) params.append("to", to);

    const response = await api.get<ApiResponse<BookingListResponse>>(
      `/bookings?${params.toString()}`,
    );

    return response.data;
  }
}

export default new BookingService();
