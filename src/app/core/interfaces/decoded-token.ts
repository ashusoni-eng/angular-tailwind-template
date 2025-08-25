export interface DecodedToken {
  sub: string;
  name: string;
  surname: string;
  email: string;
  avatar_url?: string;
  profile_image?: string;
  user_type: string;
  permissions: string[];
  exp: number;
  iat: number;
  entity_type: string;
}
