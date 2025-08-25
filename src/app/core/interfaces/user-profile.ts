export interface UserProfile {
  id?: string;
  name?: string;
  password?: string;
  password_confirmation?: string;
  surname?: string;
  avatar_path?: string;
  avatar_url?: string;
  email?: string;
  country_id?: number;
  user_type?: string;
  otp_expiry_time?: number;
  tel_cell?: string;
}
