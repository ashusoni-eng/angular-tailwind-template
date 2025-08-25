import {LoginCredentials} from './login-credentials';

export interface SignupCredentials extends LoginCredentials {
  name: string;
  surname: string;
  password_confirmation: string;
  country_id: number | null;
  tel_cell: string;
}
