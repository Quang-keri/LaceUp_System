package org.sport.backend.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;
import org.sport.backend.dto.base.ApiResponse;
import org.sport.backend.dto.base.PageResponse;
import org.sport.backend.dto.request.category.CategoryRequest;
import org.sport.backend.dto.request.category.UpdateCategoryRequest;
import org.sport.backend.dto.response.category.CategoryResponse;
import org.sport.backend.service.CategoryService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/categories")
@Tag(name = "7. Category")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public ApiResponse<PageResponse<CategoryResponse>> getAllCategories(

            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,

            @RequestParam(required = false) String keyword,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime from,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime to

    ) {
        try {
            return ApiResponse.success(
                    200,
                    "Get categories successfully",
                    categoryService.getAllCategories(
                            page,
                            size,
                            keyword,
                            from,
                            to
                    )
            );
        } catch (Exception e) {
            return ApiResponse.error(500, e.getMessage());
        }
    }

    @PostMapping
    @PreAuthorize("hasAuthority('CREATE_CATEGORY')")
    public ApiResponse<CategoryResponse> createCategory(
            @Valid @RequestBody CategoryRequest request
    ) {
        try {
            return ApiResponse.success(
                    201,
                    "Create category successfully",
                    categoryService.createCategory(request)
            );
        } catch (Exception e) {
            return ApiResponse.error(500, e.getMessage());
        }
    }

    @PutMapping("/{categoryId}")
    @PreAuthorize("hasAuthority('UPDATE_CATEGORY')")
    public ApiResponse<CategoryResponse> updateCategory(
            @PathVariable Integer categoryId,
            @Valid @RequestBody UpdateCategoryRequest request
    ) {
        try {
            return ApiResponse.success(
                    200,
                    "Update category successfully",
                    categoryService.updateCategory(categoryId, request)
            );
        } catch (Exception e) {
            return ApiResponse.error(500, e.getMessage());
        }
    }

    @DeleteMapping("/{categoryId}")
    @PreAuthorize("hasAuthority('DELETE_CATEGORY')")
    public ApiResponse<?> deleteCategory(
            @PathVariable Integer categoryId
    ) {
        try {
            categoryService.deleteCategory(categoryId);
            return ApiResponse.success(
                    200,
                    "Delete category successfully",
                    null
            );
        } catch (Exception e) {
            return ApiResponse.error(500, e.getMessage());
        }
    }

    @GetMapping("/{categoryId}")
    public ApiResponse<?> getCategoryById(
            @PathVariable Integer categoryId
    ) {
        try {
            return ApiResponse.success(
                    200,
                    "Get category successfully",
                    categoryService.getCategoryById(categoryId)
            );
        } catch (Exception e) {
            return ApiResponse.error(500, e.getMessage());
        }
    }

}