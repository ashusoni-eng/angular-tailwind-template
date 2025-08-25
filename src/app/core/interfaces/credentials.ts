export interface Credentials {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  expiresIn: number;
}
