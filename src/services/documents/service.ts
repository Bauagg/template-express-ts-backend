import { Transaction } from 'sequelize';
import path from 'path';
import fs from 'fs';
import { createDocument, findDocumentById, updateDocument, deleteDocument, bulkCreateDocument, bulkUpdateDocument, findDocumentByIds } from './repository';
import { NotFoundError } from '../../utils/app-error';
import { UploadDocumentInput, UpdateDocumentInput } from './types';

const getUploadDir = () => path.resolve(process.env.PATH_FILE_UPLOAD?.trim() ?? 'files');

const saveFileToDisk = (file: Express.Multer.File): { fileUrl: string; filePath: string } => {
  const uploadDir = getUploadDir();

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const ext = path.extname(file.originalname);
  const uniqueName = `${crypto.randomUUID()}${ext}`;
  const filePath = path.join(uploadDir, uniqueName);

  fs.writeFileSync(filePath, file.buffer);

  const uploadFolder = process.env.PATH_FILE_UPLOAD?.trim() ?? 'files';
  const baseUrl = process.env.BASE_URL ?? 'http://localhost:4000';
  const fileUrl = `${baseUrl}/${uploadFolder}/${uniqueName}`;

  return { fileUrl, filePath };
};

const deleteFileFromDisk = (fileUrl: string): void => {
  // ekstrak nama file dari URL lalu cari di disk
  const uniqueName = fileUrl.split('/').pop() ?? '';
  const filePath = path.join(getUploadDir(), uniqueName);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

export const uploadDocumentService = async (
  file: Express.Multer.File,
  input: UploadDocumentInput,
  t: Transaction
) => {
  const { fileUrl } = saveFileToDisk(file);

  return createDocument({
    file_name: file.originalname,
    file_url: fileUrl,
    file_type: file.mimetype,
    user_id: input.user_id,
    created_by: input.created_by,
    updated_by: input.updated_by,
    ref_id: input.ref_id ?? null,
    ref_type: input.ref_type ?? null,
  }, t);
};

export const getDocumentService = async (id: string, t: Transaction) => {
  const document = await findDocumentById(id, t);
  if (!document) throw new NotFoundError('Dokumen tidak ditemukan');
  return document;
};

export const updateDocumentService = async (
  id: string,
  input: UpdateDocumentInput,
  t: Transaction,
  file?: Express.Multer.File
) => {
  const document = await findDocumentById(id, t);
  if (!document) throw new NotFoundError('Dokumen tidak ditemukan');

  const updateData: Partial<UpdateDocumentInput & {
    file_name: string;
    file_url: string;
    file_type: string;
  }> = { ...input };

  // jika ada file baru, hapus file lama lalu tulis file baru ke disk dengan UUID
  if (file) {
    deleteFileFromDisk(document.file_url);
    updateData.file_name = file.originalname;
    updateData.file_url = saveFileToDisk(file).fileUrl;
    updateData.file_type = file.mimetype;
  }

  await updateDocument(id, updateData, t);
  return findDocumentById(id, t);
};

export const bulkUploadDocumentService = async (
  files: Express.Multer.File[],
  input: UploadDocumentInput,
  t: Transaction
) => {
  const data = files.map((file) => ({
    file_name: file.originalname,
    file_url: saveFileToDisk(file).fileUrl,
    file_type: file.mimetype,
    user_id: input.user_id,
    created_by: input.created_by,
    updated_by: input.updated_by,
    ref_id: input.ref_id ?? null,
    ref_type: input.ref_type ?? null,
  }));

  return bulkCreateDocument(data, t);
};

export const bulkUpdateDocumentService = async (
  ids: string[],
  input: Pick<UpdateDocumentInput, 'updated_by' | 'ref_id' | 'ref_type'>,
  t: Transaction
) => {
  return bulkUpdateDocument(ids, input, t);
};

// bulk upsert: file dengan id yang ada → update (ganti file lama), yang tidak ada → create baru
export interface BulkUpsertItem {
  id?: string;
  file: Express.Multer.File;
  ref_id?: string;
  ref_type?: string;
}

export const bulkUpsertDocumentService = async (
  items: BulkUpsertItem[],
  input: UploadDocumentInput,
  t: Transaction
) => {
  const { email, user_id } = { email: input.created_by, user_id: input.user_id };

  // pisahkan item yang punya id dan yang tidak
  const withId = items.filter((item) => item.id);
  const withoutId = items.filter((item) => !item.id);

  // cek id yang benar-benar ada di database
  const existingIds = withId.map((item) => item.id as string);
  const existingDocs = await findDocumentByIds(existingIds, t);
  const existingDocMap = new Map(existingDocs.map((doc) => [doc.id, doc]));

  const toCreate: BulkUpsertItem[] = [...withoutId];
  const toUpdate: BulkUpsertItem[] = [];

  for (const item of withId) {
    if (existingDocMap.has(item.id!)) {
      toUpdate.push(item);
    } else {
      // id dikirim tapi tidak ditemukan di DB → treat sebagai create baru
      toCreate.push(item);
    }
  }

  // update: hapus file lama, simpan file baru
  for (const item of toUpdate) {
    const doc = existingDocMap.get(item.id!)!;
    deleteFileFromDisk(doc.file_url);

    await updateDocument(item.id!, {
      file_name: item.file.originalname,
      file_url: saveFileToDisk(item.file).fileUrl,
      file_type: item.file.mimetype,
      updated_by: email,
      ref_id: item.ref_id ?? doc.ref_id,
      ref_type: item.ref_type ?? doc.ref_type,
    }, t);
  }

  // create: simpan file baru ke disk lalu insert ke DB
  const createData = toCreate.map((item) => ({
    file_name: item.file.originalname,
    file_url: saveFileToDisk(item.file).fileUrl,
    file_type: item.file.mimetype,
    user_id,
    created_by: email,
    updated_by: email,
    ref_id: item.ref_id ?? null,
    ref_type: item.ref_type ?? null,
  }));

  const created = createData.length > 0 ? await bulkCreateDocument(createData, t) : [];

  return {
    created: created.length,
    updated: toUpdate.length,
  };
};

export const deleteDocumentService = async (id: string, deleted_by: string, t: Transaction) => {
  const document = await findDocumentById(id, t);
  if (!document) throw new NotFoundError('Dokumen tidak ditemukan');

  await updateDocument(id, { deleted_by }, t);
  await deleteDocument(id, t);

  // hapus file fisik dari disk setelah soft delete berhasil
  deleteFileFromDisk(document.file_url);
};
