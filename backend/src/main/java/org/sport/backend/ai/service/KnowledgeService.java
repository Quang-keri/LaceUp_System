package org.sport.backend.ai.service;

import org.springframework.transaction.annotation.Transactional;

public interface KnowledgeService {
    void importTextData(String text);

    @Transactional(readOnly = true)
    void trainAiWithRentalAreas();

    void resetAiMemory();
}
