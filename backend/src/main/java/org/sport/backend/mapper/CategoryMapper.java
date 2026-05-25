package org.sport.backend.mapper;

import org.mapstruct.Mapper;
import org.sport.backend.dto.response.category.CategoryResponse;
import org.sport.backend.entity.Category;

import java.util.List;

@Mapper(componentModel = "spring")
public interface CategoryMapper {

    CategoryResponse toCategoryResponse(Category category);

    List<CategoryResponse> toCategoryResponseList(List<Category> categories);
}
