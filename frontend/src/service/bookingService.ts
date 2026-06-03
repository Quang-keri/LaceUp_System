import api from "../config/axios";
import type { BookingListResponse, BookingResponse } from "../types/booking";
import type { ApiResponse } from "../types/ApiResponse";

class BookingService {
  async getPendingTransferBookings(rentalId: string, page = 1, size = 10) {
    const res = await api.get(`/bookings/intent/rental/${rentalId}`, {
      params: {
        status: "PENDING_OWNER_CONFIRM",
        page,
        size,
      },
    });

    return res.data;
  }

  async ownerConfirmBooking(intentId: string) {
    const res = await api.post(`/bookings/intent/${intentId}/owner-confirm`);

    return res.data;
  }
  async previewOwnerBookingPrice(payload: {
    slots: { courtCopyId: string; startTime: string; endTime: string }[];
  }) {
    const response = await api.post<ApiResponse<number>>(
      "/bookings/preview-price",
      payload,
    );
    return response.data;
  }

  async createOwnerBooking(payload: {
    customerName: string;
    phone: string;
    note: string;
    totalPrice: number;
    paidAmount: number;
    paymentMethod: string;
    slots: { courtCopyId: string; startTime: string; endTime: string }[];
  }) {
    const response = await api.post<ApiResponse<BookingResponse>>(
      "/bookings/owner",
      payload,
    );
    return response.data;
  }

  async getServicesByRentalArea(rentalAreaId: string) {
    const response = await api.get<ApiResponse<any[]>>(
      `/rental-areas/${rentalAreaId}/services`,
    );
    return response.data;
  }

  async addExtraServices(
    bookingId: string,
    items: {
      serviceId: string;
      quantity: number;
    }[],
  ) {
    const response = await api.post(`/bookings/${bookingId}/services`, {
      items: items,
    });
    return response.data;
  }

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
    searchKeyword?: string,
    from?: string,
    to?: string,
  ) {
    const params = new URLSearchParams();

    params.append("rentalId", rentalAreaId);
    params.append("page", page.toString());
    params.append("size", size.toString());
    params.append("keyword", searchKeyword || "");

    if (status) params.append("bookingStatus", status);
    if (from) params.append("from", from);
    if (to) params.append("to", to);

    const response = await api.get<ApiResponse<BookingListResponse>>(
      `/bookings/my-rentals?${params.toString()}`,
    );

    return response.data;
  }

  async getMyBookings(
    status?: string,
    searchKeyword?: string,
    from?: string,
    to?: string,
    page: number = 1,
    size: number = 10,
  ) {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("size", size.toString());
    params.append("keyword", searchKeyword || "");
    params.append("bookingStatus", status || "");
    params.append("from", from || "");
    params.append("to", to || "");

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

  async downloadInvoice(bookingId: string) {
    const response = await api.get(`/bookings/${bookingId}/invoice/download`, {
      responseType: "blob",
    });
    return response;
  }

  async collectRemainingPayment(bookingId: string) {
    const response = await api.put<ApiResponse<any>>(
      `/bookings/${bookingId}/collect-payment`,
    );
    return response.data;
  }

  async cancelBooking(bookingId: string) {
    const response = await api.put<ApiResponse<void>>(
      `/bookings/${bookingId}/cancel`,
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

  async checkAvailability(payload: {
    courtId: string;
    startTime: string;
    endTime: string;
    quantity: number;
  }) {
    const response = await api.post("/bookings/check-availability", payload);
    return response.data;
  }

  async exportBookingsExcel(params: {
    rentalId?: string;
    bookingStatus?: string;
    keyword?: string;
    from?: string;
    to?: string;
  }) {
    const response = await api.get(`/bookings/export/excel`, {
      params,
      responseType: "blob",
    });
    return response;
  }
}

export default new BookingService();
