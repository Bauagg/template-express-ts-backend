import { Transaction } from 'sequelize';
import FlexParam, { FlexParamCreationAttributes } from './model';

export const createFlexParam = async (data: FlexParamCreationAttributes, t?: Transaction) => {
  return FlexParam.create(data, { transaction: t });
};

export const findAllFlexParams = async (filters: { type_param?: string }, t?: Transaction) => {
  return FlexParam.findAll({
    where: {
      ...(filters.type_param && { type_param: filters.type_param }),
    },
    order: [['created_at', 'DESC']],
    transaction: t,
  });
};

export const findFlexParamById = async (id: string, t?: Transaction) => {
  return FlexParam.findByPk(id, { transaction: t });
};

export const findFlexParamsByType = async (type_param: string, t?: Transaction) => {
  return FlexParam.findAll({ where: { type_param }, order: [['value_param', 'ASC']], transaction: t });
};

export const findFlexParamsByHeaderId = async (header_id: string, t?: Transaction) => {
  return FlexParam.findAll({ where: { header_id }, order: [['created_at', 'DESC']], transaction: t });
};

export const updateFlexParam = async (id: string, data: Partial<FlexParamCreationAttributes>, t?: Transaction) => {
  return FlexParam.update(data, { where: { id }, transaction: t });
};

export const deleteFlexParam = async (id: string, t?: Transaction) => {
  return FlexParam.destroy({ where: { id }, transaction: t });
};
