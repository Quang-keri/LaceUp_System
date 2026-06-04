import type { SlotResponse } from "./slot";

export const CourtStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
} as const;

export type CourtStatus = (typeof CourtStatus)[keyof typeof CourtStatus];

export const CourtCopyStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
} as const;

export type CourtCopyStatus =
  (typeof CourtCopyStatus)[keyof typeof CourtCopyStatus];

export interface BookingShortResponse {
  bookingId: string;
  note?: string;
  userName: string;
  userPhone: string;
}

export interface CourtImageResponse {
  courtImageId?: string;
  imageUrl: string;
  isCover?: boolean;
  createdAt?: string;
}

export interface CourtCopyResponse {
  courtCopyId: string;
  courtCode: string;
  status: CourtCopyStatus;
  slots?: SlotResponse[];
  location?: string;
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
  surfaceType?: string;
  indoor?: boolean;
  amenityIds?: number[];
  createdAt?: string;
  updatedAt?: string;
  priceRules: CourtPriceResponse[];
}

export interface CourtPriceResponse {
  courtPriceId: string;
  courtId: string;
  startTime: string;
  endTime: string;
  startDate: string;
  endDate: string;
  pricePerHour: number;
  specificDate: string;
  priceType: string;
  dayType: string;
  priority: number;
}

export interface CreateCourtRequest {
  courtName: string;
  categoryId: string;
  pricePerHour: number;
  rentalAreaId: string;
  courtCodes: string[];
  surfaceType?: string;
  indoor?: boolean;
  amenityIds?: number[];
}

export interface UpdateCourtRequest {
  courtId?: string;
  courtName?: string;
  categoryId?: string;
  rentalAreaId?: string;
  status?: CourtStatus;

  courtCodes?: string[];
  surfaceType?: string;
  indoor?: boolean;
  amenityIds?: number[];
}

export interface CreateCourtCopyRequest {
  courtId: string;
  courtCode: string;
  location?: string;
}

export interface UpdateCourtCopyRequest {
  courtId: string;
  courtCode: string;
  status: CourtCopyStatus;
  location?: string;
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
