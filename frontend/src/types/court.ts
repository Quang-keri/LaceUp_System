export interface CourtResponse {
  courtId: string;
  courtName: string;
  categoryId: string;
  categoryName: string;
  price: number;
  rentalAreaId: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCourtRequest {
  courtName: string;
  categoryId: string;
  price: number;
  rentalAreaId: string;
  courtCodes: string[];
}

export interface UpdateCourtRequest {
  courtName?: string;
  categoryId?: string;
  price?: number;
  courtCodes?: string[];
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
