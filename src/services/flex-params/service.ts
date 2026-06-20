import { Transaction } from 'sequelize';
import {
  createFlexParam,
  findFlexParamById,
  updateFlexParam,
  deleteFlexParam,
} from './repository';
import {
  uploadDocumentService,
  updateDocumentService,
  deleteDocumentService,
} from '../documents/service';
import { NotFoundError } from '../../utils/app-error';
import { FlexParamCreationAttributes } from './model';
import { CreateFlexParamInput, UpdateFlexParamInput } from './types';

export const createFlexParamService = async (
  input: CreateFlexParamInput,
  t: Transaction,
  file?: Express.Multer.File
) => {
  let photo_id: string | null = null;
  let photo_url: string | null = null;

  // jika ada file → upload ke documents dulu, ambil id dan url nya
  if (file) {
    const doc = await uploadDocumentService(file, {
      user_id: input.user_id,
      created_by: input.created_by,
      updated_by: input.updated_by,
    }, t);

    photo_id = doc.id;
    photo_url = doc.file_url;
  }

  return createFlexParam({
    ...input,
    photo_id,
    photo_url,
  } as FlexParamCreationAttributes, t);
};

export const updateFlexParamService = async (
  id: string,
  input: UpdateFlexParamInput,
  t: Transaction,
  file?: Express.Multer.File
) => {
  const flexParam = await findFlexParamById(id, t);
  if (!flexParam) throw new NotFoundError('Flex param tidak ditemukan');

  let photo_id = flexParam.photo_id;
  let photo_url = flexParam.photo_url;

  if (file && flexParam.photo_id) {
    // sudah punya photo → update document (hapus file lama dari disk, simpan baru)
    const updatedDoc = await updateDocumentService(flexParam.photo_id, {
      updated_by: input.updated_by,
    }, t, file);

    photo_url = updatedDoc?.file_url ?? photo_url;
  } else if (file && !flexParam.photo_id) {
    // belum punya photo → create document baru
    const doc = await uploadDocumentService(file, {
      user_id: flexParam.user_id,
      created_by: input.updated_by,
      updated_by: input.updated_by,
    }, t);

    photo_id = doc.id;
    photo_url = doc.file_url;
  }

  await updateFlexParam(id, { ...input, photo_id, photo_url }, t);

  return findFlexParamById(id, t);
};

export const deleteFlexParamService = async (id: string, deleted_by: string, t: Transaction) => {
  const flexParam = await findFlexParamById(id, t);
  if (!flexParam) throw new NotFoundError('Flex param tidak ditemukan');

  // jika ada photo → hapus document + file fisik dari disk dulu
  if (flexParam.photo_id) {
    await deleteDocumentService(flexParam.photo_id, deleted_by, t);
  }

  await updateFlexParam(id, { deleted_by }, t);
  await deleteFlexParam(id, t);
};
