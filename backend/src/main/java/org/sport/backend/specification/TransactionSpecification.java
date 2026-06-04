package org.sport.backend.specification;

import jakarta.persistence.criteria.Predicate;
import org.sport.backend.constant.MoneyFlow;
import org.sport.backend.constant.TransactionType;
import org.sport.backend.entity.Transaction;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class TransactionSpecification {

    public static Specification<Transaction> filterTransactions(
            String keyword,
            TransactionType type,
            LocalDateTime startDate,
            LocalDateTime endDate
    ) {
        return filterTransactions(keyword, type, null, startDate, endDate);
    }

    public static Specification<Transaction> filterTransactions(
            String keyword,
            TransactionType type,
            MoneyFlow moneyFlow,
            LocalDateTime startDate,
            LocalDateTime endDate
    ) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (StringUtils.hasText(keyword)) {
                predicates.add(
                        criteriaBuilder.like(
                                criteriaBuilder.lower(root.get("description")),
                                "%" + keyword.toLowerCase() + "%"
                        )
                );
            }

            if (type != null) {
                predicates.add(criteriaBuilder.equal(root.get("type"), type));
            }

            if (moneyFlow != null) {
                predicates.add(criteriaBuilder.equal(root.get("moneyFlow"), moneyFlow));
            }

            if (startDate != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("transactionDate"), startDate));
            }

            if (endDate != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("transactionDate"), endDate));
            }

            assert query != null;
            query.orderBy(criteriaBuilder.desc(root.get("transactionDate")));

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}
