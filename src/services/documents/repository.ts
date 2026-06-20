import { Transaction } from 'sequelize';
import File, { FileCreationAttributes } from './model';

export const createDocument = async (data: FileCreationAttributes, t?: Transaction) => {
  return File.create(data, { transaction: t });
};

export const updateDocument = async (id: string, data: Partial<FileCreationAttributes>, t?: Transaction) => {
  return File.update(data, { where: { id }, transaction: t });
};

export const findDocumentById = async (id: string, t?: Transaction) => {
  return File.findByPk(id, { transaction: t });
};

export const deleteDocument = async (id: string, t?: Transaction) => {
  return File.destroy({ where: { id }, transaction: t });
};

export const findDocumentByIds = async (ids: string[], t?: Transaction) => {
  return File.findAll({ where: { id: ids }, transaction: t });
};

export const bulkCreateDocument = async (data: FileCreationAttributes[], t?: Transaction) => {
  return File.bulkCreate(data, { transaction: t });
};

export const bulkUpdateDocument = async (ids: string[], data: Partial<FileCreationAttributes>, t?: Transaction) => {
  return File.update(data, { where: { id: ids }, transaction: t });
};
