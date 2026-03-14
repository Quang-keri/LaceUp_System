package org.sport.backend.specification;

import jakarta.persistence.criteria.Predicate;
import org.sport.backend.constant.CourtCopyStatus;
import org.sport.backend.entity.CourtCopy;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class CourtCopySpecification {

    public static Specification<CourtCopy> filter(
            String keyword,
            CourtCopyStatus status,
            LocalDateTime fromDate,
            LocalDateTime toDate,
            UUID ownerId
    ){
        return (root, query, cb) -> {

            List<Predicate> predicates = new ArrayList<>();

            if(keyword != null && !keyword.isEmpty()){
                predicates.add(
                        cb.like(
                                cb.lower(root.get("courtCode")),
                                "%" + keyword.toLowerCase() + "%"
                        )
                );
            }

            if(status != null){
                predicates.add(
                        cb.equal(root.get("status"), status)
                );
            }

            if(fromDate != null){
                predicates.add(
                        cb.greaterThanOrEqualTo(root.get("createdAt"), fromDate)
                );
            }

            if(toDate != null){
                predicates.add(
                        cb.lessThanOrEqualTo(root.get("createdAt"), toDate)
                );
            }

            if(ownerId != null){
                predicates.add(
                        cb.equal(root.get("court").get("owner").get("userId"), ownerId)
                );
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

}