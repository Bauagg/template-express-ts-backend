export interface CreateFlexParamInput {
  type_param: string;
  value_param: string;
  description?: string;
  user_id: string;
  header_id?: string;
  created_by: string;
  updated_by: string;
}

export interface UpdateFlexParamInput {
  type_param?: string;
  value_param?: string;
  description?: string;
  header_id?: string;
  updated_by: string;
}