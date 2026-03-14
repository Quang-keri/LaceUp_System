package org.sport.backend.repository.mongo;

import org.sport.backend.entity.mongo.TemporaryRegistration;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TemporaryRegistrationRepository extends MongoRepository<TemporaryRegistration, String> {
}
