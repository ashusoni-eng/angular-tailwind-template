import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest, HttpStatusCode } from '@angular/common/http';
import {inject, Injectable} from '@angular/core';
import {catchError, finalize, Observable, retry, share, throwError, timeout, timer} from 'rxjs';
import {environment} from '../../environments/environment';
import {InterceptorConfig} from './interfaces/interceptor-config';
import {EnhancedError} from './interfaces/enhanced-error';
import { CredentialsService } from './services/credentials.service';

@Injectable({ providedIn: 'root' })
export class ApiInterceptorService {
  private readonly credentialsService = inject(CredentialsService);

  private readonly pendingRequests = new Map<string, Observable<HttpEvent<any>>>();

  private readonly config: InterceptorConfig = {
    retryCount: 2,
    timeoutMs: 30000,
    excludedUrls: [
      '/api/auth/login',
      '/api/auth/refresh',
      '/api/country-list',
    ]
  };

  private getRequestKey(req: HttpRequest<any>): string {
    return `${req.method}-${req.urlWithParams}-${JSON.stringify(req.body)}`;
  }

  private shouldIntercept(url: string): boolean {
    return !this.config.excludedUrls.some(excludedUrl => url.includes(excludedUrl));
  }

  private addSecurityHeaders(request: HttpRequest<any>): HttpRequest<any> {
    if (!this.shouldIntercept(request.url)) {
      return request;
    }

    let headers = request.headers;

    // Add CSRF token if available
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (csrfToken) {
      headers = headers.set('X-CSRF-Token', csrfToken);
    }

    // Add timestamp to prevent caching where necessary
    if (request.method === 'GET' && !request.headers.get('cache-control')) {
      headers = headers.set('Cache-Control', 'no-cache');
      headers = headers.set('Pragma', 'no-cache');
    }

    return request.clone({ headers });
  }

  private addAuthHeaders(request: HttpRequest<any>): HttpRequest<any> {
    if (!this.shouldIntercept(request.url)) {
      return request;
    }

    let headers = request.headers;
    const credentials = this.credentialsService.credentials();

    if (credentials?.accessToken) {
      headers = headers.set('Authorization', `Bearer ${credentials.accessToken}`);
    }

    // Set content type if not FormData
    if (!(request.body instanceof FormData)) {
      headers = headers.set('Content-Type', 'application/json');
    }

    return request.clone({ headers });
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    if (error.status === HttpStatusCode.Unauthorized) {
      this.credentialsService.setCredentials();
      window.location.href = '/login';
    }

    const enhancedError: EnhancedError = {
      status: error.status,
      message: error.message,
      url: error.url ?? 'unknown',
      timestamp: new Date().toISOString(),
      details: error.error,
    };

    if (!environment.production) {
      console.error('API Error:', enhancedError);
    }

    return throwError(() => enhancedError);
  }

  intercept(request: HttpRequest<any>, handler: HttpHandlerFn): Observable<HttpEvent<any>> {
    // Add security headers
    request = this.addSecurityHeaders(request);

    // Add auth
    request = this.addAuthHeaders(request);
    const requestKey = this.getRequestKey(request);
    const pendingRequest = this.pendingRequests.get(requestKey);
    if (pendingRequest) {
      return pendingRequest;
    }

    const newRequest = handler(request).pipe(
      timeout(this.config.timeoutMs),

      retry({
        count: this.config.retryCount,
        delay: (error, retryCount) => {
          if (error instanceof HttpErrorResponse) {
            if (![502, 503, 504].includes(error.status)) {
              return throwError(() => error);
            }
          }
          return timer(Math.pow(2, retryCount) * 1000);
        }
      }),
      catchError(error => this.handleError(error)),
      finalize(() => {
        this.pendingRequests.delete(requestKey);
      }),
      share()
    );
    this.pendingRequests.set(requestKey, newRequest);

    return newRequest;
  }
}


export const apiInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  handler: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const interceptorService = inject(ApiInterceptorService);
  return interceptorService.intercept(request, handler);
};
