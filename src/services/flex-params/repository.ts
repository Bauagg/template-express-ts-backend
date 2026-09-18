import { Transaction, WhereOptions, OrderItem, Op } from 'sequelize';
import FlexParam, { FlexParamCreationAttributes } from './model';

export const createFlexParam = async (data: FlexParamCreationAttributes, t?: Transaction) => {
  return FlexParam.create(data, { transaction: t });
};

export const findAllFlexParams = async (
  where: WhereOptions,
  order: OrderItem[],
  page: number,
  limit: number,
  t?: Transaction
) => {
  return FlexParam.findAndCountAll({
    where,
    order: order.length ? order : [['created_at', 'DESC']],
    limit,
    offset: (page - 1) * limit,
    transaction: t,
  });
};

export const findFlexParamById = async (id: string, t?: Transaction) => {
  return FlexParam.findByPk(id, { transaction: t });
};

export const findFlexParamsByIds = async (ids: string[], t?: Transaction) => {
  return FlexParam.findAll({ where: { id: ids }, transaction: t });
};

// cek duplikat value_param dalam type_param+owner_id yang sama, exclude id tertentu (untuk update)
// value_param dicocokkan case-insensitive (ILIKE) supaya "Makanan" dan "makanan" dianggap sama
export const findDuplicateFlexParam = async (
  type_param: string,
  value_param: string,
  owner_id: string | null,
  t?: Transaction,
  excludeId?: string
) => {
  return FlexParam.findOne({
    where: {
      type_param,
      value_param: { [Op.iLike]: value_param },
      owner_id,
      ...(excludeId && { id: { [Op.ne]: excludeId } }),
    },
    transaction: t,
  });
};

export const findFlexParamsByType = async (
  type_param: string,
  where: WhereOptions,
  order: OrderItem[],
  page: number,
  limit: number,
  t?: Transaction
) => {
  return FlexParam.findAndCountAll({
    where: { [Op.and]: [{ type_param }, where] },
    order: order.length ? order : [['value_param', 'ASC']],
    limit,
    offset: (page - 1) * limit,
    transaction: t,
  });
};

export const findFlexParamsByHeaderId = async (
  header_id: string,
  where: WhereOptions,
  order: OrderItem[],
  page: number,
  limit: number,
  t?: Transaction
) => {
  return FlexParam.findAndCountAll({
    where: { [Op.and]: [{ header_id }, where] },
    order: order.length ? order : [['created_at', 'DESC']],
    limit,
    offset: (page - 1) * limit,
    transaction: t,
  });
};

// ambil flex_params by type_param + owner_id, dengan pagination di level DB.
// dipakai role-menu-permissions untuk listing role (type_param=ROLE_OWNER) milik 1 owner.
export const findFlexParamsByTypeAndOwner = async (
  type_param: string,
  owner_id: string,
  where: WhereOptions,
  order: OrderItem[],
  page: number,
  limit: number,
  t?: Transaction
) => {
  return FlexParam.findAndCountAll({
    where: { [Op.and]: [{ type_param, owner_id }, where] },
    order: order.length ? order : [['created_at', 'DESC']],
    limit,
    offset: (page - 1) * limit,
    transaction: t,
  });
};

// ambil flex_params by kumpulan id + type_param tertentu.
// dipakai untuk resolve detail menu (type_param=MENU_APP_LUMA) dari daftar id sekaligus,
// tanpa filter owner_id karena menu bersifat master global (owner_id-nya null)
export const findFlexParamsByIdsAndType = async (
  ids: string[],
  type_param: string,
  t?: Transaction
) => {
  if (ids.length === 0) return [];

  return FlexParam.findAll({
    where: { id: ids, type_param },
    order: [['value_param', 'ASC']],
    transaction: t,
  });
};

export const updateFlexParam = async (id: string, data: Partial<FlexParamCreationAttributes>, t?: Transaction) => {
  return FlexParam.update(data, { where: { id }, transaction: t });
};

export const deleteFlexParam = async (id: string, t?: Transaction) => {
  return FlexParam.destroy({ where: { id }, transaction: t });
};
