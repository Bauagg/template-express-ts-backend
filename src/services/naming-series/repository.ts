import { Transaction } from 'sequelize';
import NamingSeries, { NamingSeriesCreationAttributes } from './model';

export const findNamingSeriesById = async (id: string, t?: Transaction) => {
  return NamingSeries.findByPk(id, { transaction: t });
};

export const findNamingSeriesByKey = async (
  prefix: string,
  year: number,
  company_code: string,
  t?: Transaction
) => {
  return NamingSeries.findOne({
    where: { prefix, year, company_code },
    transaction: t,
    lock: t ? Transaction.LOCK.UPDATE : undefined,
  });
};

export const createNamingSeries = async (data: NamingSeriesCreationAttributes, t?: Transaction) => {
  return NamingSeries.create(data, { transaction: t });
};

export const incrementSeq = async (id: string, t?: Transaction) => {
  return NamingSeries.increment('seq', { where: { id }, transaction: t, by: 1 });
};
