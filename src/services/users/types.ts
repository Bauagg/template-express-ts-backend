export interface RegisterInput {
  full_name: string;
  username: string;
  email: string;
  phone: string;
  password: string;
  role: string;
  company_name?: string;
  agree: boolean;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface CreateEmployeeInput {
  full_name: string;
  username: string;
  email: string;
  phone: string;
  password: string;
  role: string;
  company_id: string;
  header_id: string;
}

export interface UpdateProfileInput {
  full_name?: string;
  phone?: string;
}