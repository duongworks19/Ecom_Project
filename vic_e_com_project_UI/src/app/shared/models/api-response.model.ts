/** Wrapper chuẩn của mọi response từ backend VICMART. */
export interface ApiResponse<T> {
  success: boolean;
  code: string | null;
  message: string;
  field: string | null;
  data: T;
}
