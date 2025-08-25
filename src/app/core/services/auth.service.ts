import { computed, inject, Injectable, Injector, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NavigationEnd, Router } from '@angular/router';
import { CredentialsService } from './credentials.service';
import { environment } from '../../../environments/environment';
import { AuthError } from '../interfaces/auth-error';
import { DecodedToken } from '../interfaces/decoded-token';
import { catchError, finalize, map, Observable, tap, throwError } from 'rxjs';
import { LoginCredentials } from '../interfaces/login-credentials';
import { SignupCredentials } from '../interfaces/signup-credentials';
import { EnhancedError } from '../interfaces/enhanced-error';
import { createAuthError } from '../utils/error.utils';
import { decodeToken, isValidToken } from '../utils/token.utils';
import { VerifyOtp } from '../interfaces/verify-otp';
import { ApiResponse } from '../interfaces/api-response';
import { Credentials } from '../interfaces/credentials';
import { handleApiResponse } from '../utils/api.utils';
import { AuthProvider } from '../interfaces/auth-provider';
import { AuthResponse } from '../interfaces/auth-response';
import { ToastrService } from 'ngx-toastr';
import { ResetPassword } from '../interfaces/reset-password';
import { ProfilePassword } from '../interfaces/profile-password';
import { UsersService } from './users.service';
import { CookieService } from 'ngx-cookie-service';
  import * as CryptoJS from 'crypto-js';
@Injectable({
  providedIn: 'root'
})
export class AuthService {
private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly credentialsService = inject(CredentialsService);
  protected readonly toastr = inject(ToastrService);

  private readonly apiUrl = `${environment.apiUrl}`;
  private readonly _loading = signal(false);
  private readonly _error = signal<AuthError | null>(null);
  public readonly _currentUser = signal<DecodedToken | null>(null);
  private readonly userService = inject(UsersService);  

  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly currentUser = this._currentUser.asReadonly();
  // profileImage = signal('/assets/images/user-avatar.png');
  profileImage = signal(localStorage.getItem('profileImage') || '/assets/images/dummy.png');
  readonly currentUserData = signal<any>(null);
  private secretKey: string = environment.secretKey;

  readonly isAdmin = computed(() =>
    this._currentUser()?.user_type === 'Admin'
  );

  readonly isSuperAdmin = computed(() =>
    this._currentUser()?.user_type === 'Super Admin'
  );

  readonly hasPermission = (permission: string) => computed(() =>
    this._currentUser()?.permissions.includes(permission) ?? false
  );


  //to reset error
  public resetError(): void {
    this._error.set(null);
  }

  constructor(private injector: Injector, private cookieService: CookieService) {
    this.initializeFromToken();
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.resetError();
      }
    });
    this.loadUserFromStorage(); // Load user on service initialization
  }

  private handleRequest<T>(request: Observable<ApiResponse<T>>): Observable<T> {
    this._loading.set(true);

    return request.pipe(
      map(response => handleApiResponse<T>(response)),
      catchError(error => throwError(() => error)),
      finalize(() => this._loading.set(false))
    );
  }

  getAuthRedirectUrl(provider: AuthProvider, referralCode?: string): Observable<{ url: string }> {
    return this.handleRequest<{ url: string }>(
      this.http.get<ApiResponse<{ url: string }>>(`${this.apiUrl}/auth/${provider}/redirect?referral_code=${referralCode || ''}`)
    );
  }

  handleAuthCallback(provider: string, code: string, referralCode:string | null = null) {
    this._loading.set(true);
    this._error.set(null);
    return this.handleRequest(this.http.get<ApiResponse<AuthResponse>>(`${this.apiUrl}/auth/${provider}/callback`, { params: { code, referral_code : referralCode || '' } })).pipe(
      tap(response => this.handleAuthSuccess(response)),
      map(() => void 0),
      catchError(error => this.handleAuthError(error)),
      finalize(() => this._loading.set(false))
    );
  }

  login(credentials: LoginCredentials): Observable<void> {
    this._loading.set(true);
    this._error.set(null);

    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/auth/login`, credentials).pipe(
      tap((response: any) => {
        localStorage.setItem('otp_expiry_time', response?.data?.otp_expiry_time);

        this.handleSuccess(response)
      }),
      map(() => void 0),
      catchError(error => this.handleAuthError(error)),
      finalize(() => this._loading.set(false))
    );
  }
  verifyOTP(credentials: VerifyOtp): Observable<void> {
    this._loading.set(true);
    this._error.set(null);

    return this.handleRequest(this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/auth/verify-otp`, credentials)).pipe(
      tap((response: any) => {
        this.handleAuthSuccess(response)
        if (credentials?.rememberMe) {
          this.setRememberMe(credentials?.email, credentials?.password, credentials?.rememberMe);
        } else {
          this.clearRememberMe();
        }
      }),
      // map(() => void 0),
      catchError(error => this.handleAuthError(error)),
      finalize(() => this._loading.set(false))
    );
  }

  setRememberMe(email: string, password: any, rememberMe: any) {
    const expirationDate = new Date();
    expirationDate.setTime(expirationDate.getTime() + 24 * 60 * 60 * 1000); // 24 hours
    // this.cookieService.set('rememberEmail', email, expirationDate);
    // this.cookieService.set('rememberPassword', password, expirationDate);

    const encryptedEmail = this.encrypt(email);
    const encryptedPassword = this.encrypt(password);
    this.cookieService.set('rememberEmail', encryptedEmail, expirationDate);
    this.cookieService.set('rememberPassword', encryptedPassword, expirationDate);
    this.cookieService.set('rememberMe', rememberMe, expirationDate);
  }

  getRememberedCredentials() {
    const encryptedEmail = this.cookieService.get('rememberEmail');
    const encryptedPassword = this.cookieService.get('rememberPassword');
    return {
      email: encryptedEmail ? this.decrypt(encryptedEmail) : '',
      password: encryptedPassword ? this.decrypt(encryptedPassword) : '',
      rememberMe: this.cookieService.get('rememberMe'),
    };
  }

  clearRememberMe() {
    this.cookieService.delete('rememberEmail');
    this.cookieService.delete('rememberPassword');
    this.cookieService.delete('rememberMe');
  }


  checkAuth(): Observable<any> {
    return this.http.get(`${this.apiUrl}/check-auth`, { withCredentials: true });
  }

  storeToken(token: string, rememberMe: boolean) {
    if (rememberMe) {
      localStorage.setItem('credentials', token);
    } else {
      sessionStorage.setItem('credentials', token);
    }
  }


  signup(credentials: SignupCredentials): Observable<void> {
    this._loading.set(true);
    this._error.set(null);

    if (credentials.password !== credentials.password_confirmation) {
      const passwordError: AuthError = {
        status: 422,
        code: 'PASSWORD_MISMATCH',
        message: 'Passwords do not match',
        details: {
          password: ["Password do not match"],
          confirmPassword: ["Confirm password do not match"]
        }
      };
      this._error.set(passwordError);
      this._loading.set(false)
      return throwError(() => passwordError);
    }

    return this.http.post<ApiResponse<undefined>>(`${this.apiUrl}/auth/register`, credentials).pipe(
      tap(response => this.handleSuccess(response)),
      map(() => void 0),
      catchError(error => this.handleAuthError(error)),
      finalize(() => this._loading.set(false)),
    );
  }

  refreshToken(): Observable<void> {
    const refreshToken = this.credentialsService.credentials()?.refreshToken;

    if (!refreshToken) {
      return throwError(() => ({
        code: 'NO_REFRESH_TOKEN',
        message: 'No refresh token available'
      }));
    }

    return this.handleRequest(this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/refresh`, { refreshToken })).pipe(
      tap(response => this.handleAuthSuccess(response)),
      map(() => void 0),
      catchError(error => this.handleAuthError(error))
    );
  }

  logout(redirectUrl: string = '/login'): void {
    try {
      const refreshToken = this.credentialsService.credentials()?.refreshToken;
      if (refreshToken) {
        this.http.post(`${this.apiUrl}/logout`, { refreshToken });
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      this.handleLogout(redirectUrl);
    }
  }

  requestPasswordReset(email: string): Observable<void> {
    this._loading.set(true);
    this._error.set(null);

    return this.http.post<ApiResponse<undefined>>(`${this.apiUrl}/auth/forgot-password`, { email }).pipe(
      tap(response => this.handleSuccess(response)),
      map(() => void 0),
      catchError(error => this.handleAuthError(error)),
      finalize(() => this._loading.set(false)),
    );
  }

  resetPassword(resetPassword: ResetPassword): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/auth/reset-password`, resetPassword).pipe(
      catchError(error => this.handleAuthError(error))
    );
  }

  profilePassword(profilePassword: ProfilePassword): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/auth/password`, profilePassword).pipe(
      catchError(error => this.handleAuthError(error))
    );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/change-password`, {
      currentPassword,
      newPassword
    }).pipe(
      catchError(error => this.handleAuthError(error))
    );
  }  

  private initializeFromToken(): void {
    const token = this.credentialsService.credentials()?.accessToken;
    if (token) {
      const decoded = decodeToken(token);
      if (decoded && isValidToken(decoded)) {
        this._currentUser.set(decoded);
      } else {
        this.handleLogout();
      }
    }
  }
  private handleAuthSuccess(response: AuthResponse): void {
    const token: Credentials = response.token;
    const decoded = decodeToken(token.accessToken);    
    if (!decoded || !isValidToken(decoded)) {
      throw new Error('Invalid token received');
    }

    this.credentialsService.setCredentials({
      accessToken: token.accessToken,
      refreshToken: token?.refreshToken,
      expiresIn: token.expiresIn,
      expiresAt: Date.now() + (token.expiresIn * 1000)
    });

    this._currentUser.set(decoded);
    if (decoded.profile_image) {
      // this.profileImage.set(decoded.avatar_url);
      this.profileImage.set(decoded.profile_image ?? decoded.avatar_url);
      localStorage.setItem('profileImage', decoded.profile_image);
    }
    this._error.set(null);
  }

  private handleSuccess<T>(response: ApiResponse<T>): void {
    this.toastr.success(response.message);
    this._error.set(null);
  }

  private handleAuthError(error: unknown): Observable<never> {
    const authError = createAuthError(error as EnhancedError);
    this._error.set(authError);
    return throwError(() => authError);
  }

  private handleLogout(redirectUrl: string = '/login'): void {

    this.credentialsService.setCredentials();
    this._currentUser.set(null);
    this._error.set(null);

    sessionStorage.clear();
    localStorage.clear();

    if (!this.router.url.includes(redirectUrl)) {      
      this.router.navigateByUrl(redirectUrl, { replaceUrl: true });
    }
  }

  isLoggedIn(): boolean {
    return !!this.credentialsService.credentials();
  }

  resendOtp(credentials: VerifyOtp): Observable<void> {
    this._loading.set(true);
    this._error.set(null);

    return this.handleRequest(this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/login`, credentials)).pipe(
      tap(response => this.handleAuthSuccess(response)),
      map(() => void 0),
      catchError(error => this.handleAuthError(error)),
      finalize(() => this._loading.set(false))
    );
  }

  updateProfileImage(newImageUrl: string) {
    const finalUrl = newImageUrl ?? '/assets/images/dummy.png';
    this.profileImage.set(finalUrl);

    // Save to localStorage
    localStorage.setItem('profileImage', finalUrl);
  }

  profileImageUrl() {
    return this.profileImage(); // Call it as a function
  }

  setCurrentUser(user: any): void {
    this._currentUser.set(user); // Update signal with new user data
    localStorage.setItem('currentUserData', JSON.stringify(user)); // Store updated user in localStorage
  }

  loadUserFromStorage(): void {
    const storedUser = localStorage.getItem('currentUserData');
    if (storedUser) {
      this.currentUserData.set(JSON.parse(storedUser));
    } else {
      this.loadUserData(); // If no stored user, fetch from API
    }
  }

  private getUserService(): UsersService {
    return this.injector.get(UsersService); // Lazy inject UserService to avoid circular dependency
  }

  loadUserData(): void {
    this.getUserService().getUserProfile(); // Now you can call fetchUserData safely
  }

  encrypt(data: string): string {
    return CryptoJS.AES.encrypt(data, this.secretKey).toString();
  }

  decrypt(data: string): string {
    try {
      const bytes = CryptoJS.AES.decrypt(data, this.secretKey);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Decryption error:', error);
      return '';
    }
  }

}
