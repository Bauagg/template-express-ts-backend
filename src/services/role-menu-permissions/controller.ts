import type { Request, Response } from 'express';
import sequelize from '../../databases';
import {
  createRoleMenuPermissionService,
  updateRoleMenuPermissionService,
  getAllRoleMenuPermissionsService,
  getRoleMenuPermissionByRoleService,
  deleteRoleMenuPermissionService,
} from './service';
import RoleMenuPermission, { RoleMenuPermissionAttributes } from './model';
import { sendSuccess, sendCreated, sendPaginated, parsePagination } from '../../utils/api-response';
import { handleError } from '../../utils/app-error';
import { parseFilterQuery, parseSortQuery, buildWhereFromFilters, buildOrderFromSort } from '../../utils/query-filter';

// listing sekarang bersumber dari flex_params (role), jadi key yang bisa difilter/sort
// adalah kolom flex_params. owner_id sengaja tidak ikut karena selalu di-resolve dari requester.
const ROLE_MENU_PERMISSION_FILTERABLE_KEYS = [
  'id',
  'value_param',
  'description',
  'icon',
  'color_icon',
  'color_bg_icon',
  'active',
  'created_at',
  'created_by',
  'updated_at',
  'updated_by',
] as const;

const buildRoleMenuPermissionQueryOptions = (req: Request) => {
  const { filter, sort, order: orderDirection } = req.query as { filter?: string; sort?: string; order?: string };
  const filters = parseFilterQuery(filter);
  const sortCondition = parseSortQuery(sort, orderDirection);

  return {
    where: buildWhereFromFilters(filters, ROLE_MENU_PERMISSION_FILTERABLE_KEYS),
    order: buildOrderFromSort(sortCondition, ROLE_MENU_PERMISSION_FILTERABLE_KEYS),
  };
};

interface GroupedRoleMenuPermission extends Omit<RoleMenuPermissionAttributes, 'flex_param_menu_id'> {
  flex_param_menu_id: string[];
}

// gabungkan baris-baris dengan owner_id+flex_param_role_id sama jadi 1 object,
// flex_param_menu_id dikumpulkan jadi array
const groupRoleMenuPermissions = (rows: RoleMenuPermission[]): GroupedRoleMenuPermission[] => {
  const groups = new Map<string, GroupedRoleMenuPermission>();

  for (const row of rows) {
    const plain = row.toJSON() as RoleMenuPermissionAttributes;
    const key = `${plain.owner_id ?? ''}::${plain.flex_param_role_id}`;

    const existing = groups.get(key);
    if (existing) {
      existing.flex_param_menu_id.push(plain.flex_param_menu_id);
      if (new Date(plain.updated_at ?? 0) > new Date(existing.updated_at ?? 0)) {
        existing.updated_at = plain.updated_at;
        existing.updated_by = plain.updated_by;
      }
    } else {
      groups.set(key, {
        ...plain,
        flex_param_menu_id: [plain.flex_param_menu_id],
      });
    }
  }

  return Array.from(groups.values());
};

export const createRoleMenuPermission = async (req: Request, res: Response): Promise<void> => {
  const t = await sequelize.transaction();
  try {
    const { email, user_id, role } = req.user!;

    const result = await createRoleMenuPermissionService({
      ...req.body,
      user_id,
      created_by: email,
      updated_by: email,
    }, { user_id, role }, t);

    await t.commit();
    sendCreated(res, result, 'Akses menu untuk role berhasil dibuat');
  } catch (err) {
    await t.rollback();
    handleError(err, res);
  }
};

export const updateRoleMenuPermission = async (req: Request, res: Response): Promise<void> => {
  const t = await sequelize.transaction();
  try {
    const { email, user_id, role } = req.user!;
    const result = await updateRoleMenuPermissionService({
      ...req.body,
      // diambil dari URL, ditaruh setelah ...req.body supaya tidak bisa ditimpa client lewat body
      flex_param_role_id: req.params['flex_param_role_id'] as string,
      user_id,
      updated_by: email,
    }, { user_id, role }, t);

    await t.commit();
    sendSuccess(res, result, 'Akses menu untuk role berhasil diupdate');
  } catch (err) {
    await t.rollback();
    handleError(err, res);
  }
};

export const getAllRoleMenuPermissions = async (req: Request, res: Response): Promise<void> => {
  const t = await sequelize.transaction();
  try {
    const { user_id, role } = req.user!;
    const { where, order } = buildRoleMenuPermissionQueryOptions(req);
    const { page, limit } = parsePagination(req.query as Record<string, unknown>);

    const { rows, count } = await getAllRoleMenuPermissionsService(
      { user_id, role },
      where,
      order,
      page,
      limit,
      t
    );

    await t.commit();
    sendPaginated(res, rows, count, { page, limit }, 'Berhasil mengambil data akses menu role');
  } catch (err) {
    await t.rollback();
    handleError(err, res);
  }
};

export const getRoleMenuPermissionByRole = async (req: Request, res: Response): Promise<void> => {
  const t = await sequelize.transaction();
  try {
    const { user_id, role } = req.user!;
    const { role_name } = req.query as { role_name?: string };

    const rows = await getRoleMenuPermissionByRoleService(role_name ?? '', { user_id, role }, t);
    const [result] = groupRoleMenuPermissions(rows);

    await t.commit();
    sendSuccess(res, result, 'Berhasil mengambil akses menu role');
  } catch (err) {
    await t.rollback();
    handleError(err, res);
  }
};

export const deleteRoleMenuPermission = async (req: Request, res: Response): Promise<void> => {
  const t = await sequelize.transaction();
  try {
    const { email, user_id, role } = req.user!;
    await deleteRoleMenuPermissionService(
      req.params['flex_param_role_id'] as string,
      email,
      { user_id, role },
      t
    );

    await t.commit();
    sendSuccess(res, null, 'Role dan akses menunya berhasil dihapus');
  } catch (err) {
    await t.rollback();
    handleError(err, res);
  }
};
