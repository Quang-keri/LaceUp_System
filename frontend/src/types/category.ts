export interface CategoryResponse {
  categoryId: string;
  categoryName: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryRequest {
  categoryName: string;
  description?: string;
}

export interface UpdateCategoryRequest {
  categoryName?: string;
  description?: string;
}
