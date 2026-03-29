import type { CourtResponse } from "./court";

export enum RentalAreaStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  PENDING = "PENDING",
  REJECTED = "REJECTED",
}

export interface Address {
  street: string;
  ward: string;
  district: string;
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
}

export interface RentalAreaListResponse {
  data: RentalAreaResponse[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
