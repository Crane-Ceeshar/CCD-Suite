export interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown[];
  };
}

export interface PaginationMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

export type ApiResult<T> = ApiResponse<T> | ApiError;

/** Standard query params for list endpoints */
export interface ListQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}
