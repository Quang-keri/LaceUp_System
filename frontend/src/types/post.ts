import type { AddressResponse } from "./address";

export interface AvailableCourt {
  courtId: string;
  courtName: string;
}

export interface PostResponse {
  postId: string;
  title: string;
  description: string;
  postStatus: string;
  createdAt: string | null;

  courtId: string;
  courtName: string;
  minPrice?: number;
  courtCoverImageUrl?: string;

  rentalAreaId: string;
  rentalAreaName: string;
  address: AddressResponse;

  availableCourtsCount?: number;
  availableCourts?: AvailableCourt[];
  availableSlots?: number;
}

export interface PageResponse<T> {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalElements: number;
  data: T[];
}
