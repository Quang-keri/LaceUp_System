export interface PostResponse {
  postId: string;
  title: string;
  description: string;
  postStatus: string;
  createdAt: string | null;

  courtId: string;
  courtName: string;
  price: number;
  courtCoverImageUrl: string;

  rentalAreaId: string;
  rentalAreaName: string;
  address: string;
}

export interface PageResponse<T> {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalElements: number;
  data: T[];
}

export interface PostResponse {
  postId: string;
  title: string;
  description: string;
  postStatus: string;
  createdAt: string | null;

  courtId: string;
  courtName: string;
  price: number;
  courtCoverImageUrl: string;

  rentalAreaId: string;
  rentalAreaName: string;
  address: string;
}

export interface PageResponse<T> {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalElements: number;
  data: T[];
}
