export interface BaseResponse {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
}
