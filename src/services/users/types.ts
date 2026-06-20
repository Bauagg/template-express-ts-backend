export interface RegisterInput {
  full_name: string;
  email: string;
  phone: string;
  password: string;
  role: string;
}

export interface LoginInput {
  email: string;
  password: string;
}