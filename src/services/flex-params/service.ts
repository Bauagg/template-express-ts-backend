import { Transaction } from 'sequelize';
import {
  createFlexParam,
  findFlexParamById,
  findDuplicateFlexParam,
  updateFlexParam,
  deleteFlexParam,
} from './repository';
import { findUserById } from '../users/repository';
import { OWNER_ROLE } from '../users/model';
import {
  uploadDocumentService,
  updateDocumentService,
  deleteDocumentService,
} from '../documents/service';
import { NotFoundError, ConflictError, BadRequestError } from '../../utils/app-error';
import { FlexParamCreationAttributes } from './model';
import { CreateFlexParamInput, UpdateFlexParamInput } from './types';

// type_param yang diakhiri '_OWNER' (CATEGORY_OWNER, ROLE_OWNER, dst) wajib value_param unik per owner_id
const isOwnerScopedTypeParam = (type_param: string): boolean => type_param.endsWith('_OWNER');

// owner_id tidak pernah dikirim client, tapi di-resolve dari requester:
// - kalau requester owner → owner_id = user_id-nya sendiri
// - kalau requester bukan owner (hrd, dll) → owner_id = header_id milik requester
const resolveOwnerId = async (
  requester: { user_id: string; role: string },
  t: Transaction
): Promise<string | null> => {
  if (requester.role === OWNER_ROLE) return requester.user_id;

  const requesterUser = await findUserById(requester.user_id, t);
  return requesterUser?.header_id ?? null;
};

// level tidak pernah dikirim/dipercaya dari client, selalu dihitung dari header_id:
// - tidak punya header_id → level 1 (root)
// - punya header_id → level = level milik header + 1, header_id wajib valid (exist)
const resolveLevel = async (headerId: string | null | undefined, t: Transaction): Promise<number> => {
  if (!headerId) return 1;

  const header = await findFlexParamById(headerId, t);
  if (!header) {
    throw new BadRequestError('Validasi gagal', [
      { field: 'header_id', message: 'header_id tidak ditemukan' },
    ]);
  }

  return header.level + 1;
};

export const createFlexParamService = async (
  input: CreateFlexParamInput,
  requester: { user_id: string; role: string },
  t: Transaction,
  file?: Express.Multer.File
) => {
  const id = crypto.randomUUID();
  const owner_id = await resolveOwnerId(requester, t);
  const level = await resolveLevel(input.header_id, t);

  if (isOwnerScopedTypeParam(input.type_param)) {
    const duplicate = await findDuplicateFlexParam(
      input.type_param,
      input.value_param,
      owner_id,
      t
    );
    if (duplicate) {
      throw new ConflictError('Value param sudah digunakan untuk type param ini', [
        { field: 'value_param', message: 'Value param sudah digunakan untuk type param ini' },
      ]);
    }
  }

  let photo_id: string | null = null;
  let photo_url: string | null = null;

  // jika ada file → upload ke documents dulu, ambil id dan url nya
  if (file) {
    const doc = await uploadDocumentService(file, {
      user_id: input.user_id,
      created_by: input.created_by,
      updated_by: input.updated_by,
      ref_id: id,
      ref_type: 'FILE_FLEX_PARAM',
    }, t);

    photo_id = doc.id;
    photo_url = doc.file_url;
  }

  return createFlexParam({
    ...input,
    id,
    owner_id,
    level,
    photo_id,
    photo_url,
  } as FlexParamCreationAttributes, t);
};

export const bulkCreateFlexParamService = async (
  inputs: CreateFlexParamInput[],
  requester: { user_id: string; role: string },
  t: Transaction,
  files: (Express.Multer.File | undefined)[] = []
) => {
  const results = [];

  for (let i = 0; i < inputs.length; i++) {
    const result = await createFlexParamService(inputs[i]!, requester, t, files[i]);
    results.push(result);
  }

  return results;
};

export const updateFlexParamService = async (
  id: string,
  input: UpdateFlexParamInput,
  t: Transaction,
  file?: Express.Multer.File
) => {
  const flexParam = await findFlexParamById(id, t);
  if (!flexParam) throw new NotFoundError('Flex param tidak ditemukan');

  const effectiveTypeParam = input.type_param ?? flexParam.type_param;
  const effectiveValueParam = input.value_param ?? flexParam.value_param;

  // level dihitung ulang hanya kalau header_id ikut diubah, dan tidak boleh menjadikan dirinya sendiri sebagai header
  let level = flexParam.level;
  if (input.header_id !== undefined && input.header_id !== flexParam.header_id) {
    if (input.header_id === id) {
      throw new BadRequestError('Validasi gagal', [
        { field: 'header_id', message: 'header_id tidak boleh mengacu pada dirinya sendiri' },
      ]);
    }
    level = await resolveLevel(input.header_id, t);
  }

  if (isOwnerScopedTypeParam(effectiveTypeParam)) {
    const duplicate = await findDuplicateFlexParam(
      effectiveTypeParam,
      effectiveValueParam,
      flexParam.owner_id,
      t,
      id
    );
    if (duplicate) {
      throw new ConflictError('Value param sudah digunakan untuk type param ini', [
        { field: 'value_param', message: 'Value param sudah digunakan untuk type param ini' },
      ]);
    }
  }

  let photo_id = flexParam.photo_id;
  let photo_url = flexParam.photo_url;

  if (file && flexParam.photo_id) {
    // sudah punya photo → update document (hapus file lama dari disk, simpan baru)
    const updatedDoc = await updateDocumentService(flexParam.photo_id, {
      updated_by: input.updated_by,
      ref_id: flexParam.id,
      ref_type: 'FILE_FLEX_PARAM',
    }, t, file);

    photo_url = updatedDoc?.file_url ?? photo_url;
  } else if (file && !flexParam.photo_id) {
    // belum punya photo → create document baru
    const doc = await uploadDocumentService(file, {
      user_id: flexParam.user_id,
      created_by: input.updated_by,
      updated_by: input.updated_by,
      ref_id: flexParam.id,
      ref_type: 'FILE_FLEX_PARAM',
    }, t);

    photo_id = doc.id;
    photo_url = doc.file_url;
  }

  await updateFlexParam(id, { ...input, level, photo_id, photo_url }, t);

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
