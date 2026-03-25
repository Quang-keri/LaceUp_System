export enum RentalAreaStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  PENDING = "PENDING",
  REJECTED = "REJECTED",
}

export interface RentalAreaResponse {
  rentalAreaId: string;
  rentalAreaName: string;
  address: string;
  contactName: string;
  contactPhone: string;
  status: RentalAreaStatus;
  cityId: number;
  cityName?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface CreateRentalAreaRequest {
  userId?: string;
  rentalAreaName: string;
  address: string;
  contactName: string;
  contactPhone: string;
  cityId: number;
  images?: File[];
}

export interface UpdateRentalAreaRequest {
  rentalAreaName?: string;
  address?: string;
  contactName?: string;
  contactPhone?: string;
  status?: RentalAreaStatus;
  cityId?: number;
  images?: File[];
}

export interface RentalAreaListResponse {
  data: RentalAreaResponse[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
