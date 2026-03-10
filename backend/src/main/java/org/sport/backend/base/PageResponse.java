package org.sport.backend.base;

import lombok.*;

import java.util.Collections;
import java.util.List;

@Builder
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class PageResponse<T> {
    private int currentPage;
    private int totalPages;
    private int pageSize;
    private long totalElements;
    @Builder.Default
    private List<T> data= Collections.emptyList();
}
