export interface ApiResponse<T> {
  success: true;
  data: T;
  meta: {
    total?: number;
    timestamp: string;
  };
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface SearchParams {
  query: string;
  limit?: number;
}
