export enum BookingStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  CANCELLED = "CANCELLED",
  COMPLETED = "COMPLETED",
}

export interface BookingResponse {
  bookingId: string;
  rentalAreaId: string;
  rentalAreaName: string;
  courtId: string;
  courtName: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  status: BookingStatus;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BookingListResponse {
  data: BookingResponse[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface CreateBookingRequest {
  rentalAreaId: string;
  courtId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  notes?: string;
}

export interface UpdateBookingRequest {
  status?: BookingStatus;
  notes?: string;
}
