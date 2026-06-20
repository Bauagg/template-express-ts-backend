import type { Request, Response } from 'express';
import sequelize from '../../databases';
import { createFlexParamService, updateFlexParamService, deleteFlexParamService } from './service';
import { findAllFlexParams, findFlexParamById, findFlexParamsByType, findFlexParamsByHeaderId } from './repository';
import { sendSuccess, sendCreated } from '../../utils/api-response';
import { handleError, NotFoundError } from '../../utils/app-error';

export const createFlexParam = async (req: Request, res: Response): Promise<void> => {
  const t = await sequelize.transaction();
  try {
    const { email, user_id } = req.user!;

    const result = await createFlexParamService({
      ...req.body,
      user_id,
      created_by: email,
      updated_by: email,
    }, t, req.file);

    await t.commit();
    sendCreated(res, result, 'Flex param berhasil dibuat');
  } catch (err) {
    await t.rollback();
    handleError(err, res);
  }
};

export const getAllFlexParams = async (req: Request, res: Response): Promise<void> => {
  const t = await sequelize.transaction();
  try {
    const { type_param } = req.query as { type_param?: string };
    const result = await findAllFlexParams({ type_param }, t);
    await t.commit();
    sendSuccess(res, result, 'Berhasil mengambil data flex params');
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
    const result = await findFlexParamsByType(req.params['type_param'] as string, t);
    await t.commit();
    sendSuccess(res, result, 'Berhasil mengambil flex params by type');
  } catch (err) {
    await t.rollback();
    handleError(err, res);
  }
};

export const getFlexParamsByHeaderId = async (req: Request, res: Response): Promise<void> => {
  const t = await sequelize.transaction();
  try {
    const result = await findFlexParamsByHeaderId(req.params['header_id'] as string, t);
    await t.commit();
    sendSuccess(res, result, 'Berhasil mengambil flex params by header id');
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
