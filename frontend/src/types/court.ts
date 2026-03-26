export enum CourtStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}

export enum CourtCopyStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}

export interface CourtCopyResponse {
  courtCopyId: string;
  courtCode: string;
  status: CourtCopyStatus;
  slots?: SlotResponse[];
}

export interface BookingShortResponse {
  bookingId: string;
  note?: string;
  userName: string;
  userPhone: string;
}

export interface SlotResponse {
  slotId?: string;
  courtCopyId?: string;
  courtCode?: string;
  startTime?: string;
  endTime?: string;
  price?: number;
  slotStatus?: string;
  bookingShortResponse?: BookingShortResponse;
}

export interface CourtImageResponse {
  courtImageId?: string;
  imageUrl: string;
  createdAt?: string;
}

export interface CourtResponse {
  courtId: string;
  courtName: string;
  courtCode?: string;
  categoryId?: string;
  categoryName?: string;
  pricePerHour: number;
  rentalAreaId: string;
  status?: CourtStatus;
  description?: string;
  images?: CourtImageResponse[];
  courtCopies?: CourtCopyResponse[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCourtRequest {
  courtName: string;
  categoryId: string;
  pricePerHour: number;
  rentalAreaId: string;
  courtCodes: string[];
  surfaceType?: string;
  indoor?: boolean;
}

export interface UpdateCourtRequest {
  courtName?: string;
  categoryId?: string;
  pricePerHour?: number;
  courtCodes?: string[];
  surfaceType?: string;
  indoor?: boolean;
}

export interface CreateCourtCopyRequest {
  courtId: string;
  courtCode: string;
}

export interface UpdateCourtCopyRequest {
  courtId: string;
  courtCode: string;
  status: CourtCopyStatus;
}

export interface CourtListResponse {
  data: CourtResponse[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface CategoryResponse {
  categoryId: string;
  categoryName: string;
}
