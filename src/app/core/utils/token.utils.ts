import {jwtDecode} from 'jwt-decode';
import { DecodedToken } from '../interfaces/decoded-token';

export function decodeToken(token: string): DecodedToken | null {
  try {
    return jwtDecode<DecodedToken>(token);
  } catch {
    return null;
  }
}

export function isValidToken(decoded: DecodedToken | null, bufferSeconds: number = 60): boolean {
  if (!decoded?.exp) return false;
  return decoded.exp * 1000 > (Date.now() + (bufferSeconds * 1000));
}