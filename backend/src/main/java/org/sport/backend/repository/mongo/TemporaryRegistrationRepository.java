package org.sport.backend.repository.mongo;

import org.rent.room.be.entity.TemporaryRegistration;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TemporaryRegistrationRepository extends MongoRepository<TemporaryRegistration, String> {
}
