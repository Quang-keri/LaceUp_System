package org.sport.backend.serviceImpl;

import org.sport.backend.base.PageResponse;
import org.sport.backend.dto.request.category.CategoryRequest;
import org.sport.backend.dto.request.category.UpdateCategoryRequest;
import org.sport.backend.dto.response.category.CategoryResponse;
import org.sport.backend.entity.Category;
import org.sport.backend.repository.CategoryRepository;
import org.sport.backend.service.CategoryService;
import org.sport.backend.specification.CategorySpecification;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;


import java.time.LocalDateTime;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@Service
public class CategoryServiceImpl implements CategoryService{
   @Autowired
   private CategoryRepository categoryRepository;

    @Override
    public CategoryResponse createCategory(CategoryRequest request) {
        String name = request.getCategoryName() == null ? null : request.getCategoryName().trim();

        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Category name is required");
        }

        if (categoryRepository.existsByCategoryNameIgnoreCase(name)) {
            throw new IllegalArgumentException("Category name already exists");
        }

        Category category = Category.builder()
                .categoryName(name)
                .build();

        category = categoryRepository.save(category);
        return mapToResponse(category);
    }

    @Override
    public CategoryResponse updateCategory(Integer categoryId, UpdateCategoryRequest request) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new NoSuchElementException("Category not found"));

        String name = request.getCategoryName() == null ? null : request.getCategoryName().trim();

        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Category name is required");
        }

        if (!category.getCategoryName().equalsIgnoreCase(name)
                && categoryRepository.existsByCategoryNameIgnoreCase(name)) {
            throw new IllegalArgumentException("Category name already exists");
        }

        category.setCategoryName(name);

        category = categoryRepository.save(category);
        return mapToResponse(category);
    }

    @Override
    public void deleteCategory(Integer categoryId) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new NoSuchElementException("Category not found"));


        if (category.getCourts() != null && !category.getCourts().isEmpty()) {
            throw new IllegalArgumentException("Category is being used by courts, cannot delete");
        }

        categoryRepository.delete(category);
    }

    @Override
    public CategoryResponse getCategoryById(Integer categoryId) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new NoSuchElementException("Category not found"));
        return mapToResponse(category);
    }

    @Override
    public PageResponse<CategoryResponse> getAllCategories(
            int page,
            int size,
            String keyword,
            LocalDateTime from,
            LocalDateTime to
    ) {

        Pageable pageable = PageRequest.of(
                page -1,
                size,
                Sort.by("createdAt").descending()
        );

        Specification<Category> spec = CategorySpecification.filter(
                keyword,
                from,
                to
        );

        Page<Category> categoryPage = categoryRepository.findAll(spec, pageable);

        List<CategoryResponse> responses = categoryPage
                .getContent()
                .stream()
                .map(this::mapToResponse)
                .toList();

        return PageResponse.<CategoryResponse>builder()
                .currentPage(categoryPage.getNumber())
                .totalPages(categoryPage.getTotalPages())
                .pageSize(categoryPage.getSize())
                .totalElements(categoryPage.getTotalElements())
                .data(responses)
                .build();
    }

    private CategoryResponse mapToResponse(Category category) {
        return CategoryResponse.builder()
                .categoryId(category.getCategoryId())
                .categoryName(category.getCategoryName())
                .build();
    }
}
