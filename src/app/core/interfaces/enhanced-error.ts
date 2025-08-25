export interface EnhancedError {
  status: number;
  message: string;
  url: string;
  timestamp: string;
  details: {
    success: boolean;
    message: string;
    errors?: Record<string, string[]>;
    data?: Record<string, string[]>;
  };
}
