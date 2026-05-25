import type { CourtResponse } from "./court";

export const RentalAreaStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  REJECTED: "REJECTED",
} as const;

export type RentalAreaStatus =
  (typeof RentalAreaStatus)[keyof typeof RentalAreaStatus];

export interface Address {
  street: string;
  ward: string;
}

export interface RentalAreaResponse {
  rentalAreaId: string;
  rentalAreaName: string;
  address: Address;
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
}

export interface CreateRentalAreaRequest {
  userId?: string;
  rentalAreaName: string;
  address: Address;
  cityId: number;
  contactName: string;
  contactPhone: string;
  images?: File[];
  openTime?: string;
  closeTime?: string;
}

export interface UpdateRentalAreaRequest {
  rentalAreaName?: string;
  address?: Address;
  contactName?: string;
  contactPhone?: string;
  cityId?: number;
  openTime?: string;
  closeTime?: string;
  isActive?: boolean;
  status: RentalAreaStatus;
}

export interface RentalAreaListResponse {
  data: RentalAreaResponse[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
