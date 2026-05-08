package org.sport.backend.repository;

import org.sport.backend.entity.News;
import org.sport.backend.entity.NewsImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;
@Repository
public interface NewsImageRepository extends JpaRepository<NewsImage, UUID> , JpaSpecificationExecutor<NewsImage> {
    List<NewsImage> findByNews(News news);
}
