export interface ApiErrorBody {
  status?: number;
  code?: string;
  message?: string;
  field?: string;
  success?: boolean;
}

export interface ApiError {
  status: number;
  code: string;
  message: string;
  field?: string;
  isNetworkError: boolean;
}
