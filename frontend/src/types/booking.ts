export const BookingStatus = {
  BOOKED: "BOOKED",
  USING: "USING",
  CANCELLED: "CANCELLED",
  COMPLETED: "COMPLETED",
} as const;

export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];

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
  extraServiceResponses?: BookingServiceResponse[];
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

export interface BookingServiceResponse {
  serviceId: string;
  serviceName: string;
  quantity: number;
  price: number;
}
