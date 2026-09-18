import { ValidationError as SequelizeValidationError, UniqueConstraintError, ForeignKeyConstraintError, DatabaseError } from 'sequelize';
import type { Response } from 'express';
import { sendServerError, sendBadRequest, sendConflict } from './api-response';

export interface FieldError {
  field: string;
  message: string;
}

export class AppError extends Error {
  public statusCode: number;
  public status: string;
  public errors?: FieldError[];

  constructor(message: string, statusCode: number, errors?: FieldError[]) {
    super(message);
    this.statusCode = statusCode;
    this.status = statusCode >= 500 ? 'error' : 'fail';
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Request tidak valid', errors?: FieldError[]) {
    super(message, 400, errors);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Tidak terautentikasi', errors?: FieldError[]) {
    super(message, 401, errors);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Tidak memiliki akses') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Data tidak ditemukan') {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Data sudah ada', errors?: FieldError[]) {
    super(message, 409, errors);
  }
}

export class InternalServerError extends AppError {
  constructor(message = 'Terjadi kesalahan pada server') {
    super(message, 500);
  }
}

// handle error dari Sequelize dan AppError
export const handleError = (err: unknown, res: Response): Response => {
  // validasi field dari Sequelize (misal notNull, notEmpty, len)
  if (err instanceof SequelizeValidationError) {
    const errors = err.errors.map((e) => ({
      field: e.path ?? 'unknown',
      message: e.message,
    }));
    return sendBadRequest(res, 'Validasi gagal', errors);
  }

  // data duplikat (unique constraint)
  if (err instanceof UniqueConstraintError) {
    const fields = err.errors.map((e) => e.path ?? 'field').join(', ');
    return sendConflict(res, `${fields} sudah digunakan`);
  }

  // foreign key tidak ditemukan
  if (err instanceof ForeignKeyConstraintError) {
    return sendBadRequest(res, 'Referensi data tidak ditemukan');
  }

  // error database lainnya
  if (err instanceof DatabaseError) {
    return sendServerError(res, 'Terjadi kesalahan pada database');
  }

  // AppError (custom error yang kita throw sendiri)
  if (err instanceof AppError) {
    const body: Record<string, unknown> = {
      status: err.status,
      message: err.message,
    };
    if (err.errors) body['errors'] = err.errors;
    return res.status(err.statusCode).json(body);
  }

  // error tak terduga
  return sendServerError(res);
};
