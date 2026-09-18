// role_name dipakai untuk cari/buat row flex_params (type_param=ROLE_OWNER) sebagai flex_param_role_id.
// description/icon/color_icon/color_bg_icon/active adalah metadata milik row ROLE_OWNER itu, bukan role_menu_permissions.
// flex_param_menu_id wajib array minimal 1 id, nanti di-expand jadi banyak baris relasi role<->menu.
export interface CreateRoleMenuPermissionInput {
  role_name: string;
  flex_param_menu_id: string[];
  description?: string;
  icon?: string;
  color_icon?: string;
  color_bg_icon?: string;
  active?: boolean;
  user_id: string;
  created_by: string;
  updated_by: string;
}

// update mengidentifikasi role lewat flex_param_role_id (bukan role_name) karena role_name bisa diedit.
// field metadata (role_name/description/icon/dll) opsional: kalau dikirim, dipakai untuk update row flex_params ROLE_OWNER itu.
// flex_param_menu_id wajib array (full sync: menu yang tidak ada di array akan dihapus).
export interface UpdateRoleMenuPermissionInput {
  flex_param_role_id: string;
  flex_param_menu_id: string[];
  role_name?: string;
  description?: string;
  icon?: string;
  color_icon?: string;
  color_bg_icon?: string;
  active?: boolean;
  user_id: string;
  updated_by: string;
}
