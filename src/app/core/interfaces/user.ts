
export interface User {
  id: number;
  name: string;
  surname: string;
  avatar_path: string;  
  email: string;  
  user_type: 'Super Admin' | 'Admin' | 'User';
  status: 'Active' | 'In_Active';  
  created_at: string;
}
