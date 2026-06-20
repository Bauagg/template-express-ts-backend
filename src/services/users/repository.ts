import { Transaction } from 'sequelize';
import User, { UserCreationAttributes } from './model';

export const findUserByEmail = async (email: string, t?: Transaction) => {
  return User.findOne({ where: { email }, transaction: t });
};

export const findUserByUsername = async (username: string, t?: Transaction) => {
  return User.findOne({ where: { username }, transaction: t });
};

export const findUserByPhone = async (phone: string, t?: Transaction) => {
  return User.findOne({ where: { phone }, transaction: t });
};

export const findUserById = async (id: string, t?: Transaction) => {
  return User.findByPk(id, {
    attributes: { exclude: ['password'] },
    transaction: t,
  });
};

export const createUser = async (data: UserCreationAttributes, t?: Transaction) => {
  return User.create(data, { transaction: t });
};
