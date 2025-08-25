import {computed, effect, Inject, Injectable, Optional, Signal, signal} from '@angular/core';
import {Credentials} from '../interfaces/credentials';
import { AuthService } from './auth.service';
import { firstValueFrom } from 'rxjs';
import { decodeToken, isValidToken } from '../utils/token.utils';

@Injectable({
  providedIn: 'root'
})
export class CredentialsService {
  private readonly storageKey = 'credentials';
  private readonly tokenExpirationBuffer = 60;

  private readonly _credentials = signal<Credentials | null>(null);
  private readonly _isRefreshing = signal(false);

  public readonly credentials: Signal<Credentials | null> = computed(() => this._credentials());

  public readonly isAuthenticated: Signal<boolean> = computed(() => {
    const credentials = this._credentials();
    if (!credentials?.accessToken) return false;
    return Boolean(credentials.expiresAt && (credentials?.expiresAt > Date.now()));
  });
  public readonly isRefreshing: Signal<boolean> = computed(() => this._isRefreshing());

  constructor( @Optional() @Inject('AUTH_SERVICE_PROVIDER') private authService?: AuthService) {
    this.loadSavedCredentials();

    effect(() => {
      const credentials = this._credentials();      
      if (credentials) {
        this.setupTokenRefreshTimer(credentials);
      }
    });
  }

  setCredentials(credentials?: Credentials): void {
    if (credentials) {
      try {
        const decoded = decodeToken(credentials.accessToken);
        if (!decoded || !isValidToken(decoded)) {
          throw new Error('Invalid token');
        }

        // Encrypt sensitive data before storing
        const encrypted = this.encryptCredentials(credentials);
        localStorage.setItem(this.storageKey, encrypted);

        this._credentials.set(credentials);
      } catch (error) {
        console.error('Error setting credentials:', error);
        this.clearCredentials();
      }
    } else {
      this.clearCredentials();
    }
  }

  private clearCredentials(): void {
    localStorage.removeItem(this.storageKey);
    this._credentials.set(null);
    this._isRefreshing.set(false);
  }

  private loadSavedCredentials(): void {
    try {
      const encrypted = localStorage.getItem(this.storageKey);
      if (!encrypted) return;

      const credentials = this.decryptCredentials(encrypted);
      if (!credentials) return;

      const decoded = decodeToken(credentials.accessToken);
      if (!decoded || !isValidToken(decoded)) {
        throw new Error('Invalid or expired token');
      }

      this._credentials.set(credentials);
    } catch (error) {
      console.error('Error loading credentials:', error);
      this.clearCredentials();
    }
  }

  private setupTokenRefreshTimer(credentials: Credentials): void {
    const decoded = decodeToken(credentials.accessToken);
    if (!decoded) return;

    const expiresIn = decoded.exp * 1000 - Date.now();
    const refreshTime = expiresIn - (this.tokenExpirationBuffer * 1000);

    if (refreshTime <= 0) {
      this.refreshToken();
    } else {
      setTimeout(() => this.refreshToken(), refreshTime);
    }
  }

  private encryptCredentials(credentials: Credentials): string {
    return btoa(JSON.stringify(credentials));
  }

  private decryptCredentials(encrypted: string): Credentials | null {
    try {
      return JSON.parse(atob(encrypted));
    } catch {
      return null;
    }
  }

  private async refreshToken(): Promise<void> {
    if (this._isRefreshing() || !this._credentials()) return;

    this._isRefreshing.set(true);

    try {
      if (this.authService) {
        await firstValueFrom(this.authService.refreshToken());
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      this.clearCredentials();
    } finally {
      this._isRefreshing.set(false);
    }
  }
}
