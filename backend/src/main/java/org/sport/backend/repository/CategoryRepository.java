package org.sport.backend.repository;

import org.rent.room.be.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<Category, Integer> {
    boolean existsByCategoryName(String categoryName);
    boolean existsByCategoryNameIgnoreCase(String categoryName);
}
