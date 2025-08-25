import { HttpErrorResponse } from "@angular/common/http";
import { EnhancedError } from "../interfaces/enhanced-error";
import { AuthError } from "../interfaces/auth-error";

export function createEnhancedError(error: HttpErrorResponse): EnhancedError {
    return {
      status: error.status,
      message: error.message,
      url: error.url ?? 'unknown',
      timestamp: new Date().toISOString(),
      details: error.error,
    };
  }

  export function createAuthError(error: EnhancedError): AuthError {
    switch (error.status) {
      case 0:
        return {
          status: 401,
          code: 'NETWORK_ERROR',
          message: 'Something went wrong. Please try again later.'
        };
      case 401:
        return {
          status: 401,
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        };
      case 422:
        return {
          status: 422,
          code: 'VALIDATION_ERROR',
          message: error.details.message || 'Please check your input',
          details: error.details.errors
        };
      default:
        return {
          status: 500,
          code: 'SERVER_ERROR',
          message: error.details?.message || error.message || 'An unexpected error occurred'
        };
    }
  }

