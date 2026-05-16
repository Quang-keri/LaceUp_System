export interface PageResponse<T> {
    data: T[];
    currentPage: number;
    totalPages: number;
    totalElements: number;
    pageSize: number;
    last?: boolean;
    numberOfElements?: number;
    first?: boolean;
    empty?: boolean;
}