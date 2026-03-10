package org.sport.backend.repository;

import org.sport.backend.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Integer> {
    boolean existsByCategoryName(String categoryName);
    boolean existsByCategoryNameIgnoreCase(String categoryName);
}
