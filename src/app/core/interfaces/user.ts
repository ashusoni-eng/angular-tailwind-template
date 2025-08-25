import {Country} from './country';

export interface User {
  id: number;
  name: string;
  surname: string;
  avatar_path: string;
  avatar_url?: string;
  email: string;
  country_id: number;
  country: Country;
  user_type: 'Super Admin' | 'Admin' | 'Agent' | 'User';
  status: 'Active' | 'In_Active';
  screen_name?: string,
  email_logo?: string,
  email_body?: string,
  entity_type?: 'Business' | 'Private',
  company_color_primary?: string,
  company_color_secondary?: string,
  subscribed?: boolean,
  subscribed_at?: string,
  parent_id?: string,
  price_range_id?: string,
  commission_range_id?: string,
  created_at: string;
}
