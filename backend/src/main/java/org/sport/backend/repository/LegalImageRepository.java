package org.sport.backend.repository;

import org.sport.backend.entity.LegalImage;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface LegalImageRepository extends CrudRepository<LegalImage, UUID> {
}
