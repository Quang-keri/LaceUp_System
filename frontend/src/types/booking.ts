export const BookingStatus = {
  BOOKED: "BOOKED",
  USING: "USING",
  CANCELLED: "CANCELLED",
  COMPLETED: "COMPLETED",
} as const;

export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];

export const BookingTypes = {
  PRIVATE: "PRIVATE",
  SHARED: "SHARED",
  MATCH: "MATCH",
} as const;

export type BookingTypes = (typeof BookingTypes)[keyof typeof BookingTypes];

export type TicketPaymentStatus =
  | "PENDING"
  | "SUCCESS"
  | "BOOKED"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED"
  | "CANCELLED_NO_REFUND"
  | "REFUND_PENDING"
  | "REFUND_FAILED"
  | "REFUNDED";

export interface CreateBookingIntentPayload {
  userId?: string;
  userName: string;
  userPhone: string;
  note?: string;
  slotRequests: { courtCopyId: string; startTime: string; endTime: string }[];
}

export interface BookingResponse {
  bookingId: string;
  userName: string;
  phoneNumber: string;
  rentalArea: { rentalAreaId: string; rentalAreaName: string };
  slots: {
    slotId: string | number;
    courtCopyId?: string;
    courtCode: string;
    courtName?: string;
    startTime: string;
    endTime: string;
    price: number;
    slotStatus?: string;
  }[];
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
  note?: string;
  createdAt?: string;
  updatedAt?: string;
  invoicePdfUrl?: string;
  depositAmount?: number;
  remainingAmount?: number;
  isFullyPaid?: boolean;
  extraServiceResponses?: BookingServiceResponse[];
  paymentMethod?: string;
  maxParticipants?: number;
  minParticipants?: number;
  currentParticipants?: number;
  pricePerTicket?: number;
  participantId?: string;
  ticketQuantity?: number;
  ticketAmount?: number;
  ticketPaymentStatus?: TicketPaymentStatus;
  ticketPaymentProofUrl?: string;
  sharedTicketParticipant?: boolean;
  ticketCollectedAmount?: number;
  activeTicketQuantity?: number;
  cancelledNoRefundQuantity?: number;
  cancelledNoRefundAmount?: number;
  minimumCheckCompleted?: boolean;
  minimumCheckedAt?: string;
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

export interface BookingParticipantResponse {
  participantId: string;
  bookingId: string;
  userId: string;
  userName: string;
  userPhone?: string;
  amountPaid: number;
  paymentStatus: TicketPaymentStatus;
  isHost: boolean;
  quantity?: number;
  pricePerTicket?: number;
  paymentProofUrl?: string;
  paymentProofUploadedAt?: string;
}
