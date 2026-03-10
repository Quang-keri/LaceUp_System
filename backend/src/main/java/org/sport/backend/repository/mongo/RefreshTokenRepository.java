//package org.sport.backend.repository.mongo;
//
//import org.rent.room.be.entity.RefreshToken;
//import org.springframework.data.mongodb.repository.MongoRepository;
//import org.springframework.stereotype.Repository;
//
//import java.time.Instant;
//import java.util.Optional;
//
//@Repository
//public interface RefreshTokenRepository extends MongoRepository<RefreshToken, String> {
//    Optional<RefreshToken> findByTokenHashAndRevokedFalse(String tokenHash);
//
//    void deleteByEmail(String email);
//
//    void deleteByExpiresAtBefore(Instant now);
//}
