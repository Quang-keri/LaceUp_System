export const BookingStatus = {
  BOOKED: "BOOKED",
  USING: "USING",
  CANCELLED: "CANCELLED",
  COMPLETED: "COMPLETED",
} as const;

export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];

export const BookingTypes = {
  ONLINE: "ONLINE",
  OFFLINE: "OFFLINE",
  MATCH: "MATCH",
} as const;

export type BookingTypes = (typeof BookingTypes)[keyof typeof BookingTypes];

export interface BookingResponse {
  userName: string;
  phoneNumber: string;
  rentalArea: {
    rentalAreaId: string;
    rentalAreaName: string;
  };
  slots: {
    slotId: string | number;
    courtCode: string;
    courtName?: string;
    startTime: string;
    endTime: string;
    price: number;
  }[];
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
  bookingType: BookingTypes;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  invoicePdfUrl?: string;
  depositAmount?: number;
  remainingAmount?: number;
  isFullyPaid?: boolean;
  extraServiceResponses?: BookingServiceResponse[];
  paymentMethod?: string;

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
