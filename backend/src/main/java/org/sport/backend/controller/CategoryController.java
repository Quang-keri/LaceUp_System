package org.sport.backend.controller;


import jakarta.validation.Valid;

import org.sport.backend.base.ApiResponse;
import org.sport.backend.base.PageResponse;
import org.sport.backend.dto.request.category.CategoryRequest;
import org.sport.backend.dto.request.category.UpdateCategoryRequest;
import org.sport.backend.dto.response.category.CategoryResponse;
import org.sport.backend.service.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;


@RestController
@RequestMapping("/categories")
public class CategoryController {
   @Autowired
   private CategoryService categoryService;
    @GetMapping
    public ApiResponse<?> getAllCategories(

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

            PageResponse<CategoryResponse> result =
                    categoryService.getAllCategories(
                            page,
                            size,
                            keyword,
                            from,
                            to
                    );

            return ApiResponse.success(
                    200,
                    "Get categories successfully",
                    result
            );

        } catch (Exception e) {
            return ApiResponse.error(500, e.getMessage());
        }

    }
    @PostMapping
    public ApiResponse<?> createCategory(
            @Valid @RequestBody CategoryRequest request
    ) {
        try {
            CategoryResponse result = categoryService.createCategory(request);
            return ApiResponse.success(
                    201,
                    "Create category successfully",
                    result
            );
        } catch (Exception e) {
            return ApiResponse.error(500, e.getMessage());
        }

    }

    @PutMapping("/{categoryId}")
    public ApiResponse<?> updateCategory(
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
            CategoryResponse result = categoryService.getCategoryById(categoryId);
            return ApiResponse.success(
                    200,
                    "Get category successfully",
                    result
            );
        } catch (Exception e) {
            return ApiResponse.error(500, e.getMessage());
        }

    }


}