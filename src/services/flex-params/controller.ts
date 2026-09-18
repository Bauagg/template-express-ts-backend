import type { Request, Response } from 'express';
import sequelize from '../../databases';
import { createFlexParamService, bulkCreateFlexParamService, updateFlexParamService, deleteFlexParamService } from './service';
import { findAllFlexParams, findFlexParamById, findFlexParamsByType, findFlexParamsByHeaderId } from './repository';
import { sendSuccess, sendCreated, sendPaginated, parsePagination } from '../../utils/api-response';
import { handleError, NotFoundError, BadRequestError } from '../../utils/app-error';
import { CreateFlexParamInput } from './types';
import { parseFilterQuery, parseSortQuery, buildWhereFromFilters, buildOrderFromSort } from '../../utils/query-filter';

const FLEX_PARAM_FILTERABLE_KEYS = [
  'id',
  'type_param',
  'value_param',
  'description',
  'user_id',
  'owner_id',
  'photo_id',
  'photo_url',
  'header_id',
  'level',
  'icon',
  'color_icon',
  'color_bg_icon',
  'active',
  'created_at',
  'created_by',
  'updated_at',
  'updated_by',
] as const;

// type_param sudah fixed dari path param, tidak perlu (dan tidak boleh) difilter lagi lewat query
const FLEX_PARAM_BY_TYPE_FILTERABLE_KEYS = FLEX_PARAM_FILTERABLE_KEYS.filter((key) => key !== 'type_param');

// header_id sudah fixed dari path param, tidak perlu (dan tidak boleh) difilter lagi lewat query
const FLEX_PARAM_BY_HEADER_FILTERABLE_KEYS = FLEX_PARAM_FILTERABLE_KEYS.filter((key) => key !== 'header_id');

const buildFlexParamQueryOptions = (req: Request, allowedKeys: readonly string[]) => {
  const { filter, sort, order: orderDirection } = req.query as { filter?: string; sort?: string; order?: string };
  const filters = parseFilterQuery(filter);
  const sortCondition = parseSortQuery(sort, orderDirection);

  return {
    where: buildWhereFromFilters(filters, allowedKeys),
    order: buildOrderFromSort(sortCondition, allowedKeys),
  };
};

export const createFlexParam = async (req: Request, res: Response): Promise<void> => {
  const t = await sequelize.transaction();
  try {
    const { email, user_id, role } = req.user!;

    const result = await createFlexParamService({
      ...req.body,
      user_id,
      created_by: email,
      updated_by: email,
    }, { user_id, role }, t, req.file);

    await t.commit();
    sendCreated(res, result, 'Flex param berhasil dibuat');
  } catch (err) {
    await t.rollback();
    handleError(err, res);
  }
};

export const bulkCreateFlexParam = async (req: Request, res: Response): Promise<void> => {
  const t = await sequelize.transaction();
  try {
    const { email, user_id, role } = req.user!;
    const files = (req.files as Express.Multer.File[]) ?? [];

    let items: Array<Partial<CreateFlexParamInput>>;
    try {
      items = typeof req.body.items === 'string' ? JSON.parse(req.body.items) : req.body.items;
    } catch {
      throw new BadRequestError('Validasi gagal', [
        { field: 'items', message: 'items harus berupa JSON array yang valid' },
      ]);
    }

    if (!Array.isArray(items) || items.length === 0) {
      throw new BadRequestError('Validasi gagal', [
        { field: 'items', message: 'items wajib diisi minimal 1 data' },
      ]);
    }

    const inputs: CreateFlexParamInput[] = items.map((item) => ({
      ...item,
      user_id,
      created_by: email,
      updated_by: email,
    })) as CreateFlexParamInput[];

    const result = await bulkCreateFlexParamService(inputs, { user_id, role }, t, files);

    await t.commit();
    sendCreated(res, result, `${result.length} flex param berhasil dibuat`);
  } catch (err) {
    await t.rollback();
    handleError(err, res);
  }
};

export const getAllFlexParams = async (req: Request, res: Response): Promise<void> => {
  const t = await sequelize.transaction();
  try {
    const { where, order } = buildFlexParamQueryOptions(req, FLEX_PARAM_FILTERABLE_KEYS);
    const { page, limit } = parsePagination(req.query as Record<string, unknown>);
    const { rows, count } = await findAllFlexParams(where, order, page, limit, t);
    await t.commit();
    sendPaginated(res, rows, count, { page, limit }, 'Berhasil mengambil data flex params');
  } catch (err) {
    await t.rollback();
    handleError(err, res);
  }
};

export const getFlexParamById = async (req: Request, res: Response): Promise<void> => {
  const t = await sequelize.transaction();
  try {
    const result = await findFlexParamById(req.params['id'] as string, t);
    if (!result) throw new NotFoundError('Flex param tidak ditemukan');
    await t.commit();
    sendSuccess(res, result, 'Berhasil mengambil flex param');
  } catch (err) {
    await t.rollback();
    handleError(err, res);
  }
};

export const getFlexParamsByType = async (req: Request, res: Response): Promise<void> => {
  const t = await sequelize.transaction();
  try {
    const { where, order } = buildFlexParamQueryOptions(req, FLEX_PARAM_BY_TYPE_FILTERABLE_KEYS);
    const { page, limit } = parsePagination(req.query as Record<string, unknown>);
    const { rows, count } = await findFlexParamsByType(req.params['type_param'] as string, where, order, page, limit, t);
    await t.commit();
    sendPaginated(res, rows, count, { page, limit }, 'Berhasil mengambil flex params by type');
  } catch (err) {
    await t.rollback();
    handleError(err, res);
  }
};

export const getFlexParamsByHeaderId = async (req: Request, res: Response): Promise<void> => {
  const t = await sequelize.transaction();
  try {
    const { where, order } = buildFlexParamQueryOptions(req, FLEX_PARAM_BY_HEADER_FILTERABLE_KEYS);
    const { page, limit } = parsePagination(req.query as Record<string, unknown>);
    const { rows, count } = await findFlexParamsByHeaderId(req.params['header_id'] as string, where, order, page, limit, t);
    await t.commit();
    sendPaginated(res, rows, count, { page, limit }, 'Berhasil mengambil flex params by header id');
  } catch (err) {
    await t.rollback();
    handleError(err, res);
  }
};

export const updateFlexParam = async (req: Request, res: Response): Promise<void> => {
  const t = await sequelize.transaction();
  try {
    const { email } = req.user!;

    const result = await updateFlexParamService(
      req.params['id'] as string,
      { ...req.body, updated_by: email },
      t,
      req.file
    );

    await t.commit();
    sendSuccess(res, result, 'Flex param berhasil diupdate');
  } catch (err) {
    await t.rollback();
    handleError(err, res);
  }
};

export const deleteFlexParam = async (req: Request, res: Response): Promise<void> => {
  const t = await sequelize.transaction();
  try {
    const { email } = req.user!;

    await deleteFlexParamService(req.params['id'] as string, email, t);

    await t.commit();
    sendSuccess(res, null, 'Flex param berhasil dihapus');
  } catch (err) {
    await t.rollback();
    handleError(err, res);
  }
};
