import type { Request, Response } from 'express';
import sequelize from '../../databases';
import { uploadDocumentService, getDocumentService, updateDocumentService, deleteDocumentService, bulkUploadDocumentService, bulkUpdateDocumentService, bulkUpsertDocumentService, BulkUpsertItem } from './service';
import { sendSuccess, sendCreated, sendBadRequest } from '../../utils/api-response';
import { handleError } from '../../utils/app-error';

export const uploadDocument = async (req: Request, res: Response): Promise<void> => {
  const t = await sequelize.transaction();
  try {
    if (!req.file) {
      sendBadRequest(res, 'Validasi gagal', [{ field: 'file', message: 'File wajib diupload' }]);
      return;
    }

    const { email, user_id } = req.user!;

    const result = await uploadDocumentService(req.file, {
      user_id,
      created_by: email,
      updated_by: email,
      ref_id: req.body.ref_id,
      ref_type: req.body.ref_type,
    }, t);

    await t.commit();
    sendCreated(res, result, 'Dokumen berhasil diupload');
  } catch (err) {
    await t.rollback();
    handleError(err, res);
  }
};

export const getDocument = async (req: Request, res: Response): Promise<void> => {
  const t = await sequelize.transaction();
  try {
    const result = await getDocumentService(req.params['id'] as string, t);
    await t.commit();
    sendSuccess(res, result, 'Berhasil mengambil dokumen');
  } catch (err) {
    await t.rollback();
    handleError(err, res);
  }
};

export const updateDocument = async (req: Request, res: Response): Promise<void> => {
  const t = await sequelize.transaction();
  try {
    const { email } = req.user!;

    const result = await updateDocumentService(
      req.params['id'] as string,
      {
        updated_by: email,
        ref_id: req.body.ref_id,
        ref_type: req.body.ref_type,
      },
      t,
      req.file
    );

    await t.commit();
    sendSuccess(res, result, 'Dokumen berhasil diupdate');
  } catch (err) {
    await t.rollback();
    handleError(err, res);
  }
};

export const bulkUploadDocument = async (req: Request, res: Response): Promise<void> => {
  const t = await sequelize.transaction();
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      sendBadRequest(res, 'Validasi gagal', [{ field: 'files', message: 'Minimal 1 file wajib diupload' }]);
      return;
    }

    const { email, user_id } = req.user!;

    const result = await bulkUploadDocumentService(files, {
      user_id,
      created_by: email,
      updated_by: email,
      ref_id: req.body.ref_id,
      ref_type: req.body.ref_type,
    }, t);

    await t.commit();
    sendCreated(res, result, `${result.length} dokumen berhasil diupload`);
  } catch (err) {
    await t.rollback();
    handleError(err, res);
  }
};

export const bulkUpdateDocument = async (req: Request, res: Response): Promise<void> => {
  const t = await sequelize.transaction();
  try {
    const { email } = req.user!;
    const files = (req.files as Express.Multer.File[]) ?? [];
    const { ids, ref_id, ref_type } = req.body as { ids: string[]; ref_id?: string; ref_type?: string };

    if (!ids || ids.length === 0) {
      sendBadRequest(res, 'Validasi gagal', [{ field: 'ids', message: 'ids wajib diisi' }]);
      return;
    }

    if (files.length > 0) {
      // ada file → update per id sesuai urutan, file[i] untuk ids[i]
      for (let i = 0; i < ids.length; i++) {
        const file = files[i]; // undefined jika tidak semua id punya file baru
        await updateDocumentService(
          ids[i]!,
          { updated_by: email, ref_id, ref_type },
          t,
          file
        );
      }
    } else {
      // tidak ada file → update data saja sekaligus
      await bulkUpdateDocumentService(ids, { updated_by: email, ref_id, ref_type }, t);
    }

    await t.commit();
    sendSuccess(res, null, `${ids.length} dokumen berhasil diupdate`);
  } catch (err) {
    await t.rollback();
    handleError(err, res);
  }
};

export const bulkUpsertDocument = async (req: Request, res: Response): Promise<void> => {
  const t = await sequelize.transaction();
  try {
    const files = (req.files as Express.Multer.File[]) ?? [];

    if (files.length === 0) {
      sendBadRequest(res, 'Validasi gagal', [{ field: 'files', message: 'Minimal 1 file wajib dikirim' }]);
      return;
    }

    const { email, user_id } = req.user!;

    // ids dikirim sebagai array string di body, urutan match dengan files
    const ids: (string | undefined)[] = Array.isArray(req.body.ids)
      ? req.body.ids
      : req.body.ids
        ? [req.body.ids]
        : [];

    const items: BulkUpsertItem[] = files.map((file, i) => ({
      file,
      id: ids[i] || undefined,
      ref_id: req.body.ref_id,
      ref_type: req.body.ref_type,
    }));

    const result = await bulkUpsertDocumentService(items, {
      user_id,
      created_by: email,
      updated_by: email,
      ref_id: req.body.ref_id,
      ref_type: req.body.ref_type,
    }, t);

    await t.commit();
    sendSuccess(res, result, `${result.created} dokumen dibuat, ${result.updated} dokumen diupdate`);
  } catch (err) {
    await t.rollback();
    handleError(err, res);
  }
};

export const deleteDocument = async (req: Request, res: Response): Promise<void> => {
  const t = await sequelize.transaction();
  try {
    const { email } = req.user!;

    await deleteDocumentService(req.params['id'] as string, email, t);

    await t.commit();
    sendSuccess(res, null, 'Dokumen berhasil dihapus');
  } catch (err) {
    await t.rollback();
    handleError(err, res);
  }
};
