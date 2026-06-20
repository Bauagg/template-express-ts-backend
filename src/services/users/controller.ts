import type { Request, Response } from 'express';
import { registerService, loginService } from './service';
import { refreshAccessToken } from '../../utils/jwt';
import { sendCreated, sendSuccess, sendUnauthorized } from '../../utils/api-response';
import { handleError } from '../../utils/app-error';
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
