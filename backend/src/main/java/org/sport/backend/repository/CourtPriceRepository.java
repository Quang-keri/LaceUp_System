package org.sport.backend.repository;

import org.sport.backend.constant.PriceType;
import org.sport.backend.entity.CourtPrice;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface CourtPriceRepository extends JpaRepository<CourtPrice, UUID>, JpaSpecificationExecutor<CourtPrice> {

    @Query("""
            SELECT p FROM CourtPrice p
            WHERE p.court.courtId = :courtId
            AND :time >= p.startTime AND :time < p.endTime
            AND (
                p.specificDate = :date 
                OR (p.specificDate IS NULL AND p.priceType IN :validPriceTypes)
            )
            ORDER BY 
                CASE WHEN p.specificDate IS NOT NULL THEN 2 ELSE 1 END DESC, 
                p.priority DESC
            """)
    List<CourtPrice> findApplicableRules(
            @Param("courtId") UUID courtId,
            @Param("time") LocalTime time,
            @Param("date") LocalDate date,
            @Param("validPriceTypes") List<PriceType> validPriceTypes, // Thêm tham số này
            Pageable pageable
    );

    List<CourtPrice> findByCourt_CourtId(UUID courtId);

    @Query("""
                SELECT MIN(p.pricePerHour), MAX(p.pricePerHour)
                FROM CourtPrice p
                WHERE p.court.courtId = :courtId
            """)
    List<Object[]> getPriceRange(UUID courtId);

    @Query("""
    SELECT p FROM CourtPrice p
    WHERE p.court.courtId = :courtId
    AND :time >= p.startTime AND :time < p.endTime
    AND (
        p.specificDate = :date 
        OR p.specificDate IS NULL
    )
""")
    List<CourtPrice> findAllMatchingRules(
            UUID courtId,
            LocalTime time,
            LocalDate date
    );
}
