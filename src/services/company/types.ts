export interface CreateCompanyInput {
  company_name: string;
  company_cabang?: boolean;
  user_id: string;
  header_id?: string;
  created_by: string;
  updated_by: string;
}

export interface UpdateCompanyInput {
  company_name?: string;
  company_cabang?: boolean;
  header_id?: string;
  updated_by: string;
}
