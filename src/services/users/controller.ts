import type { Request, Response } from 'express';
import { registerService, loginService, createEmployeeService, getEmployeeByIdService, deleteEmployeeService, updateProfileService } from './service';
import { findUserById } from './repository';
import { refreshAccessToken } from '../../utils/jwt';
import { sendCreated, sendSuccess, sendUnauthorized } from '../../utils/api-response';
import { handleError, NotFoundError } from '../../utils/app-error';
import sequelize from '../../databases';

export const register = async (req: Request, res: Response): Promise<void> => {
  const t = await sequelize.transaction();
  try {
    const result = await registerService(req.body as Parameters<typeof registerService>[0], t);
    await t.commit();
    sendCreated(res, result, 'Registrasi berhasil');
  } catch (err) {
    await t.rollback();
    handleError(err, res);
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const t = await sequelize.transaction();
  try {
    const result = await loginService(req.body as Parameters<typeof loginService>[0], t);
    await t.commit();
    sendSuccess(res, result, 'Login berhasil');
  } catch (err) {
    await t.rollback();
    handleError(err, res);
  }
};

export const createEmployee = async (req: Request, res: Response): Promise<void> => {
  const t = await sequelize.transaction();
  try {
    const { user_id, role } = req.user!;

    const result = await createEmployeeService(
      req.body as Parameters<typeof createEmployeeService>[0],
      { user_id, role },
      t
    );

    await t.commit();
    sendCreated(res, result, 'User karyawan berhasil dibuat');
  } catch (err) {
    await t.rollback();
    handleError(err, res);
  }
};

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { user_id } = req.user!;

    const user = await findUserById(user_id);
    if (!user) throw new NotFoundError('User tidak ditemukan');

    sendSuccess(res, user, 'Berhasil mengambil profil');
  } catch (err) {
    handleError(err, res);
  }
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  const t = await sequelize.transaction();
  try {
    const { user_id } = req.user!;

    const result = await updateProfileService(
      user_id,
      req.body as Parameters<typeof updateProfileService>[1],
      t,
      req.file
    );

    await t.commit();
    sendSuccess(res, result, 'Profil berhasil diupdate');
  } catch (err) {
    await t.rollback();
    handleError(err, res);
  }
};

export const getEmployeeById = async (req: Request, res: Response): Promise<void> => {
  const t = await sequelize.transaction();
  try {
    const { user_id, role } = req.user!;

    const result = await getEmployeeByIdService(req.params['id'] as string, { user_id, role }, t);

    await t.commit();
    sendSuccess(res, result, 'Berhasil mengambil data karyawan');
  } catch (err) {
    await t.rollback();
    handleError(err, res);
  }
};

export const deleteEmployee = async (req: Request, res: Response): Promise<void> => {
  const t = await sequelize.transaction();
  try {
    const { user_id, role } = req.user!;

    await deleteEmployeeService(req.params['id'] as string, { user_id, role }, t);

    await t.commit();
    sendSuccess(res, null, 'User karyawan berhasil dihapus');
  } catch (err) {
    await t.rollback();
    handleError(err, res);
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refresh_token } = req.body as { refresh_token?: string };

    if (!refresh_token) {
      sendUnauthorized(res, 'Refresh token tidak ditemukan', [
        { field: 'refresh_token', message: 'refresh_token wajib disertakan di body' },
      ]);
      return;
    }

    const result = refreshAccessToken(refresh_token);
    sendSuccess(res, result, 'Access token berhasil diperbarui');
  } catch (err) {
    handleError(err, res);
  }
};
