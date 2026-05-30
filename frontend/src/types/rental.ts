import type { AddressResponse } from "./address";
import type { CourtResponse } from "./court";

export const RentalAreaStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  REJECTED: "REJECTED",
  SUSPENDED: "SUSPENDED",
} as const;

export type RentalAreaStatus =
  (typeof RentalAreaStatus)[keyof typeof RentalAreaStatus];

export interface RentalAreaResponse {
  rentalAreaId: string;
  rentalAreaName: string;
  address: AddressResponse;
  contactName: string;
  contactPhone: string;
  status: RentalAreaStatus;
  cityId: number;
  cityName?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  courts?: CourtResponse[];
  openTime?: string;
  closeTime?: string;
  isActive?: boolean;
  latitude?: number;
  longitude?: number;
  gmailLink?: string;
  gmail?: string;
  facebookLink?: string;
  images?: ImageResponse[];
}

export interface CreateRentalAreaRequest {
  userId?: string;
  rentalAreaName: string;
  address: AddressResponse;
  cityId: number;
  contactName: string;
  contactPhone: string;
  images?: File[];
  openTime?: string;
  closeTime?: string;
}

export interface UpdateRentalAreaRequest {
  rentalAreaName?: string;
  address?: AddressResponse;
  contactName?: string;
  contactPhone?: string;
  cityId?: number;
  openTime?: string;
  closeTime?: string;
  isActive?: boolean;
  status: RentalAreaStatus;
  facebookLink?: string;
}

export interface RentalAreaListResponse {
  data: RentalAreaResponse[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface ImageResponse {
  imageUrl: string;
  isCover?: boolean;
}
