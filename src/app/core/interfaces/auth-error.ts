export interface AuthError {
  code: string;
  status: number;
  message: string;
  details?: Record<string, string[]>;
}
