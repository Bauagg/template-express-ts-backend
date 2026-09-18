import { Transaction, WhereOptions, OrderItem } from 'sequelize';
import {
  bulkCreateRoleMenuPermission,
  findRoleMenuPermissionsByRoleId,
  findRoleMenuPermissionsByRoleIds,
  findRoleMenuPermissionsByMenuIds,
  deleteRoleMenuPermissionsByRoleId,
  deleteRoleMenuPermissionsByIds,
} from './repository';
import {
  findFlexParamsByIds,
  findFlexParamById,
  findDuplicateFlexParam,
  findFlexParamsByTypeAndOwner,
  findFlexParamsByIdsAndType,
} from '../flex-params/repository';
import type FlexParam from '../flex-params/model';
import { createFlexParamService, updateFlexParamService, deleteFlexParamService } from '../flex-params/service';
import { findUserById } from '../users/repository';
import { OWNER_ROLE } from '../users/model';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../utils/app-error';
import { RoleMenuPermissionCreationAttributes } from './model';
import { CreateRoleMenuPermissionInput, UpdateRoleMenuPermissionInput } from './types';

const MENU_TYPE_PARAM = 'MENU_APP_LUMA';
const ROLE_TYPE_PARAM = 'ROLE_OWNER'; // type_param untuk role, value_param-nya (nama role) harus unik per owner_id

// owner_id tidak pernah dikirim client, tapi di-resolve dari requester:
// - kalau requester owner → owner_id = user_id-nya sendiri
// - kalau requester bukan owner (hrd, dll) → owner_id = header_id milik requester
const resolveOwnerId = async (
  requester: { user_id: string; role: string },
  t: Transaction
): Promise<string> => {
  if (requester.role === OWNER_ROLE) return requester.user_id;

  const requesterUser = await findUserById(requester.user_id, t);
  if (!requesterUser) throw new NotFoundError('User tidak ditemukan');

  if (!requesterUser.header_id) {
    throw new ForbiddenError('Anda tidak memiliki header_id, tidak dapat membuat akses menu untuk role');
  }

  return requesterUser.header_id;
};

// role_name di-resolve jadi flex_param_role_id:
// - kalau role dengan nama itu (case-insensitive) sudah ada untuk owner ini, reuse id-nya
// - kalau belum ada, create row flex_params baru (type_param=ROLE_OWNER) lewat createFlexParamService,
//   metadata (description/icon/color/active) yang dikirim client ikut disimpan di row itu
const resolveRoleId = async (
  input: CreateRoleMenuPermissionInput,
  requester: { user_id: string; role: string },
  ownerId: string,
  t: Transaction
): Promise<string> => {
  const existingRole = await findDuplicateFlexParam(ROLE_TYPE_PARAM, input.role_name, ownerId, t);
  if (existingRole) return existingRole.id;

  const role = await createFlexParamService({
    type_param: ROLE_TYPE_PARAM,
    value_param: input.role_name,
    description: input.description,
    icon: input.icon,
    color_icon: input.color_icon,
    color_bg_icon: input.color_bg_icon,
    active: input.active,
    user_id: input.user_id,
    created_by: input.created_by,
    updated_by: input.updated_by,
  }, requester, t);

  return role.id;
};

// create banyak baris relasi role<->menu sekaligus (bulk):
// - validasi semua flex_param_menu_id dalam 1 query IN (harus exist & type_param=MENU_APP_LUMA)
// - cek kombinasi yang sudah ada dalam 1 query IN, yang sudah ada di-skip (tidak error, tidak insert ulang)
// - sisanya (menu valid & belum ada) di-insert sekaligus lewat bulkCreate
const createManyRoleMenuPermissions = async (
  flexParamMenuIds: string[],
  flexParamRoleId: string,
  input: { user_id: string; updated_by: string },
  ownerId: string,
  t: Transaction
) => {
  const uniqueMenuIds = Array.from(new Set(flexParamMenuIds));

  const menus = await findFlexParamsByIds(uniqueMenuIds, t);
  const menuMap = new Map(menus.map((menu) => [menu.id, menu]));

  const missingIds = uniqueMenuIds.filter((id) => !menuMap.has(id));
  if (missingIds.length > 0) {
    throw new NotFoundError(`Menu tidak ditemukan: ${missingIds.join(', ')}`);
  }

  const invalidTypeIds = uniqueMenuIds.filter((id) => menuMap.get(id)!.type_param !== MENU_TYPE_PARAM);
  if (invalidTypeIds.length > 0) {
    throw new BadRequestError('Validasi gagal', [
      { field: 'flex_param_menu_id', message: `flex_param_menu_id harus merujuk ke menu dengan type_param ${MENU_TYPE_PARAM}` },
    ]);
  }

  const existingRows = await findRoleMenuPermissionsByMenuIds(ownerId, flexParamRoleId, uniqueMenuIds, t);
  const existingMenuIds = new Set(existingRows.map((row) => row.flex_param_menu_id));

  const menuIdsToInsert = uniqueMenuIds.filter((id) => !existingMenuIds.has(id));

  const inserted = menuIdsToInsert.length > 0
    ? await bulkCreateRoleMenuPermission(
      menuIdsToInsert.map((flex_param_menu_id) => ({
        flex_param_menu_id,
        flex_param_role_id: flexParamRoleId,
        owner_id: ownerId,
        user_id: input.user_id,
        created_by: input.updated_by,
        updated_by: input.updated_by,
      } as RoleMenuPermissionCreationAttributes)),
      t
    )
    : [];

  return [...existingRows, ...inserted];
};

export const createRoleMenuPermissionService = async (
  input: CreateRoleMenuPermissionInput,
  requester: { user_id: string; role: string },
  t: Transaction
) => {
  if (!Array.isArray(input.flex_param_menu_id) || input.flex_param_menu_id.length === 0) {
    throw new BadRequestError('Validasi gagal', [
      { field: 'flex_param_menu_id', message: 'flex_param_menu_id wajib diisi minimal 1 id' },
    ]);
  }

  const owner_id = await resolveOwnerId(requester, t);
  const flex_param_role_id = await resolveRoleId(input, requester, owner_id, t);

  return createManyRoleMenuPermissions(input.flex_param_menu_id, flex_param_role_id, input, owner_id, t);
};

// sync menu untuk role tertentu: menu yang ada di flex_param_menu_id dipertahankan/ditambah,
// menu lama yang TIDAK ada di flex_param_menu_id baru akan dihapus.
// role diidentifikasi lewat flex_param_role_id (bukan role_name, karena nama bisa berubah).
// kalau ada field metadata (role_name/description/icon/dll), row flex_params ROLE_OWNER itu ikut di-update.
export const updateRoleMenuPermissionService = async (
  input: UpdateRoleMenuPermissionInput,
  requester: { user_id: string; role: string },
  t: Transaction
) => {
  if (!Array.isArray(input.flex_param_menu_id) || input.flex_param_menu_id.length === 0) {
    throw new BadRequestError('Validasi gagal', [
      { field: 'flex_param_menu_id', message: 'flex_param_menu_id wajib diisi minimal 1 id' },
    ]);
  }

  const owner_id = await resolveOwnerId(requester, t);

  const role = await findFlexParamById(input.flex_param_role_id, t);
  if (!role || role.type_param !== ROLE_TYPE_PARAM || role.owner_id !== owner_id) {
    throw new NotFoundError('Role tidak ditemukan');
  }

  const hasMetadataUpdate =
    input.role_name !== undefined ||
    input.description !== undefined ||
    input.icon !== undefined ||
    input.color_icon !== undefined ||
    input.color_bg_icon !== undefined ||
    input.active !== undefined;

  if (hasMetadataUpdate) {
    await updateFlexParamService(input.flex_param_role_id, {
      value_param: input.role_name,
      description: input.description,
      icon: input.icon,
      color_icon: input.color_icon,
      color_bg_icon: input.color_bg_icon,
      active: input.active,
      updated_by: input.updated_by,
    }, t);
  }

  const existingRows = await findRoleMenuPermissionsByRoleId(owner_id, input.flex_param_role_id, t);

  const keepMenuIds = new Set(input.flex_param_menu_id);
  const rowsToDelete = existingRows.filter((row) => !keepMenuIds.has(row.flex_param_menu_id));

  if (rowsToDelete.length > 0) {
    await deleteRoleMenuPermissionsByIds(rowsToDelete.map((row) => row.id), input.updated_by, t);
  }

  return createManyRoleMenuPermissions(input.flex_param_menu_id, input.flex_param_role_id, input, owner_id, t);
};

// listing role milik owner beserta menu-menunya.
// sumber utamanya flex_params (type_param=ROLE_OWNER + owner_id), bukan role_menu_permissions,
// supaya pagination dihitung per-role di level DB dan role yang belum punya menu tetap muncul.
// alurnya 3 query, tidak N+1:
//   1. ambil role (paginated)
//   2. ambil semua relasi role<->menu untuk role-role itu sekaligus
//   3. ambil detail menu (type_param=MENU_APP_LUMA) untuk semua menu id sekaligus
export const getAllRoleMenuPermissionsService = async (
  requester: { user_id: string; role: string },
  where: WhereOptions,
  order: OrderItem[],
  page: number,
  limit: number,
  t: Transaction
) => {
  const owner_id = await resolveOwnerId(requester, t);

  const { rows: roles, count } = await findFlexParamsByTypeAndOwner(
    ROLE_TYPE_PARAM,
    owner_id,
    where,
    order,
    page,
    limit,
    t
  );

  const roleIds = roles.map((role) => role.id);
  const relations = await findRoleMenuPermissionsByRoleIds(owner_id, roleIds, t);

  const menuIds = Array.from(new Set(relations.map((rel) => rel.flex_param_menu_id)));
  const menus = await findFlexParamsByIdsAndType(menuIds, MENU_TYPE_PARAM, t);
  const menuMap = new Map(menus.map((menu) => [menu.id, menu]));

  // kelompokkan menu per role, menu yang sudah terhapus (tidak ada di menuMap) di-skip
  const menusByRole = new Map<string, FlexParam[]>();
  for (const rel of relations) {
    const menu = menuMap.get(rel.flex_param_menu_id);
    if (!menu) continue;

    const list = menusByRole.get(rel.flex_param_role_id);
    if (list) list.push(menu);
    else menusByRole.set(rel.flex_param_role_id, [menu]);
  }

  const data = roles.map((role) => ({
    ...role.toJSON(),
    menus: menusByRole.get(role.id) ?? [],
  }));

  return { rows: data, count };
};

export const getRoleMenuPermissionByRoleService = async (
  role_name: string,
  requester: { user_id: string; role: string },
  t: Transaction
) => {
  if (!role_name) {
    throw new BadRequestError('Validasi gagal', [
      { field: 'role_name', message: 'role_name wajib diisi' },
    ]);
  }

  const owner_id = await resolveOwnerId(requester, t);

  const role = await findDuplicateFlexParam(ROLE_TYPE_PARAM, role_name, owner_id, t);
  if (!role) {
    throw new NotFoundError('Akses menu role tidak ditemukan');
  }

  const rows = await findRoleMenuPermissionsByRoleId(owner_id, role.id, t);
  if (rows.length === 0) {
    throw new NotFoundError('Akses menu role tidak ditemukan');
  }

  return rows;
};

// hapus role secara menyeluruh: row flex_params (ROLE_OWNER) itu sendiri + semua relasi
// role<->menu di role_menu_permissions yang flex_param_role_id-nya sama
export const deleteRoleMenuPermissionService = async (
  flex_param_role_id: string,
  deletedBy: string,
  requester: { user_id: string; role: string },
  t: Transaction
) => {
  if (!flex_param_role_id) {
    throw new BadRequestError('Validasi gagal', [
      { field: 'flex_param_role_id', message: 'flex_param_role_id wajib diisi' },
    ]);
  }

  const owner_id = await resolveOwnerId(requester, t);

  const role = await findFlexParamById(flex_param_role_id, t);
  if (!role || role.type_param !== ROLE_TYPE_PARAM || role.owner_id !== owner_id) {
    throw new NotFoundError('Role tidak ditemukan');
  }

  await deleteRoleMenuPermissionsByRoleId(owner_id, flex_param_role_id, deletedBy, t);
  await deleteFlexParamService(flex_param_role_id, deletedBy, t);
};
