export interface ApiResponse<T> {
  code: number;
  message: string;
  result: T;
}

export interface BackendErrorResponse {
  code: number;
  message: string;
  result?: Record<string, string>;
}

export interface ApiErrorResponse {
  response?: {
    data: BackendErrorResponse;
    status: number;
  };
  message: string;
}
