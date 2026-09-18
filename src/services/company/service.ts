import { Transaction } from 'sequelize';
import { createCompany, findCompanyById, updateCompany, deleteCompany } from './repository';
import { findUserById } from '../users/repository';
import { OWNER_ROLE } from '../users/model';
import { NotFoundError, ForbiddenError } from '../../utils/app-error';
import { CompanyCreationAttributes } from './model';
import { CreateCompanyInput, UpdateCompanyInput } from './types';

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

export const createCompanyService = async (
  input: CreateCompanyInput,
  requester: { user_id: string; role: string },
  t: Transaction
) => {
  const owner_id = await resolveOwnerId(requester, t);

  return createCompany({ ...input, owner_id } as CompanyCreationAttributes, t);
};

export const updateCompanyService = async (
  id: string,
  input: UpdateCompanyInput,
  requester: { user_id: string; role: string },
  t: Transaction
) => {
  const company = await findCompanyById(id, t);
  if (!company) throw new NotFoundError('Company tidak ditemukan');

  if (requester.role !== OWNER_ROLE || company.user_id !== requester.user_id) {
    throw new ForbiddenError('Hanya owner pemilik company yang dapat mengupdate data ini');
  }

  await updateCompany(id, input, t);

  return findCompanyById(id, t);
};

export const deleteCompanyService = async (id: string, deleted_by: string, t: Transaction) => {
  const company = await findCompanyById(id, t);
  if (!company) throw new NotFoundError('Company tidak ditemukan');

  await updateCompany(id, { deleted_by }, t);
  await deleteCompany(id, t);
};
