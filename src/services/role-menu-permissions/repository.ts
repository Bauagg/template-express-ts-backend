import { Transaction } from 'sequelize';
import RoleMenuPermission, { RoleMenuPermissionCreationAttributes } from './model';

export const createRoleMenuPermission = async (data: RoleMenuPermissionCreationAttributes, t?: Transaction) => {
  return RoleMenuPermission.create(data, { transaction: t });
};

export const bulkCreateRoleMenuPermission = async (
  data: RoleMenuPermissionCreationAttributes[],
  t?: Transaction
) => {
  return RoleMenuPermission.bulkCreate(data, { transaction: t });
};

export const findRoleMenuPermission = async (
  owner_id: string | null,
  flex_param_role_id: string,
  flex_param_menu_id: string,
  t?: Transaction
) => {
  return RoleMenuPermission.findOne({
    where: { owner_id, flex_param_role_id, flex_param_menu_id },
    transaction: t,
  });
};

// cari semua baris existing untuk owner+role tertentu yang flex_param_menu_id-nya ada di daftar ini
// (dipakai untuk cek duplikat sekaligus banyak menu, sebelum bulkCreate)
export const findRoleMenuPermissionsByMenuIds = async (
  owner_id: string,
  flex_param_role_id: string,
  flex_param_menu_ids: string[],
  t?: Transaction
) => {
  return RoleMenuPermission.findAll({
    where: { owner_id, flex_param_role_id, flex_param_menu_id: flex_param_menu_ids },
    transaction: t,
  });
};

// ambil semua relasi untuk banyak role sekaligus (1 query IN, bukan N+1),
// dipakai listing role beserta menunya
export const findRoleMenuPermissionsByRoleIds = async (
  owner_id: string,
  flex_param_role_ids: string[],
  t?: Transaction
) => {
  if (flex_param_role_ids.length === 0) return [];

  return RoleMenuPermission.findAll({
    where: { owner_id, flex_param_role_id: flex_param_role_ids },
    transaction: t,
  });
};

export const findRoleMenuPermissionsByRoleId = async (
  owner_id: string,
  flex_param_role_id: string,
  t?: Transaction
) => {
  return RoleMenuPermission.findAll({
    where: { owner_id, flex_param_role_id },
    transaction: t,
  });
};

// hapus semua baris (semua menu) untuk flex_param_role_id+owner_id yang sama.
// karena model paranoid, destroy() hanya mengisi deleted_at — deleted_by harus di-update
// manual dulu supaya jejak siapa yang menghapus ikut tersimpan
export const deleteRoleMenuPermissionsByRoleId = async (
  owner_id: string,
  flex_param_role_id: string,
  deleted_by: string,
  t?: Transaction
) => {
  await RoleMenuPermission.update(
    { deleted_by },
    { where: { owner_id, flex_param_role_id }, transaction: t }
  );

  return RoleMenuPermission.destroy({
    where: { owner_id, flex_param_role_id },
    transaction: t,
  });
};

// hapus baris-baris tertentu by id (dipakai saat sync menu: menu lama yang tidak ada di daftar baru dihapus)
export const deleteRoleMenuPermissionsByIds = async (
  ids: string[],
  deleted_by: string,
  t?: Transaction
) => {
  await RoleMenuPermission.update(
    { deleted_by },
    { where: { id: ids }, transaction: t }
  );

  return RoleMenuPermission.destroy({
    where: { id: ids },
    transaction: t,
  });
};
