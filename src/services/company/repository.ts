import { Transaction, WhereOptions, OrderItem } from 'sequelize';
import Company, { CompanyCreationAttributes } from './model';

export const createCompany = async (data: CompanyCreationAttributes, t?: Transaction) => {
  return Company.create(data, { transaction: t });
};

export const findAllCompanies = async (where: WhereOptions, order: OrderItem[], t?: Transaction) => {
  return Company.findAll({
    where,
    order: order.length ? order : [['created_at', 'DESC']],
    transaction: t,
  });
};

export const findCompanyById = async (id: string, t?: Transaction) => {
  return Company.findByPk(id, { transaction: t });
};

export const findCompanyByUserId = async (user_id: string, t?: Transaction) => {
  return Company.findOne({ where: { user_id }, transaction: t });
};

export const updateCompany = async (id: string, data: Partial<CompanyCreationAttributes>, t?: Transaction) => {
  return Company.update(data, { where: { id }, transaction: t });
};

export const deleteCompany = async (id: string, t?: Transaction) => {
  return Company.destroy({ where: { id }, transaction: t });
};
