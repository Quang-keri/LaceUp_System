export enum BookingStatus {
  BOOKED = "BOOKED",
  CANCELLED = "CANCELLED",
  COMPLETED = "COMPLETED",
}

export interface BookingResponse {
  userName: string;
  phoneNumber: string;
  rentalArea: any;
  slots: any;
  bookingId: string;
  rentalAreaId: string;
  rentalAreaName: string;
  courtId: string;
  courtName: string;
  customerEmail?: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  bookingStatus: BookingStatus;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  invoicePdfUrl?: string;
  depositAmount?: number;
  remainingAmount?: number;
  isFullyPaid?: boolean;
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
