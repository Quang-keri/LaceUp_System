package org.sport.backend.service;

import org.sport.backend.base.PageResponse;
import org.sport.backend.dto.request.category.CategoryRequest;
import org.sport.backend.dto.request.category.UpdateCategoryRequest;
import org.sport.backend.dto.response.category.CategoryResponse;

import java.time.LocalDateTime;


public interface CategoryService {
    CategoryResponse createCategory(CategoryRequest request);

    CategoryResponse updateCategory(Integer categoryId, UpdateCategoryRequest request);

    void deleteCategory(Integer categoryId);

    CategoryResponse getCategoryById(Integer categoryId);

    PageResponse<CategoryResponse> getAllCategories(
            int page,
            int size,
            String keyword,
            LocalDateTime from,
            LocalDateTime to
    );
}
