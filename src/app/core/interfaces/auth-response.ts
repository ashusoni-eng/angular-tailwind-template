import {User} from './user';
import {Credentials} from './credentials';

export interface AuthResponse {
  user: User;
  token: Credentials;
}
