export interface CreateFlexParamInput {
  type_param: string;
  value_param: string;
  description?: string;
  user_id: string;
  header_id?: string;
  icon?: string;
  color_icon?: string;
  color_bg_icon?: string;
  active?: boolean;
  created_by: string;
  updated_by: string;
}

export interface UpdateFlexParamInput {
  type_param?: string;
  value_param?: string;
  description?: string;
  header_id?: string;
  icon?: string;
  color_icon?: string;
  color_bg_icon?: string;
  active?: boolean;
  updated_by: string;
}