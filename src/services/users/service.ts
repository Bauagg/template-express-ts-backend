import { Transaction } from 'sequelize';
import { hashPassword, comparePassword } from '../../utils/bcrypt';
import { generateTokenPair } from '../../utils/jwt';
import { generateUsername } from '../../utils/generate-username';
import { findUserByEmail, findUserByUsername, findUserByPhone, createUser } from './repository';
import { ConflictError, UnauthorizedError } from '../../utils/app-error';
import { RegisterInput, LoginInput } from './types';

export const registerService = async (input: RegisterInput, t: Transaction) => {
  const existingEmail = await findUserByEmail(input.email, t);
  if (existingEmail) throw new ConflictError('Email sudah terdaftar');

  const existingPhone = await findUserByPhone(input.phone, t);
  if (existingPhone) throw new ConflictError('Nomor telepon sudah terdaftar');

  // generate username dari full_name + random, ulangi jika masih bentrok
  let username = generateUsername(input.full_name);
  const existingUsername = await findUserByUsername(username, t);
  if (existingUsername) username = generateUsername(input.full_name);

  const hashedPassword = await hashPassword(input.password);

  const user = await createUser({
    full_name: input.full_name,
    email: input.email,
    phone: input.phone,
    password: hashedPassword,
    role: input.role,
    username,
    photo_id: null,
    photo_url: null,
  }, t);

  return {
    ...generateTokenPair({ user_id: user.id, email: user.email, role: user.role, username: user.username }),
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
    },
  };
};

export const loginService = async (input: LoginInput, t: Transaction) => {
  const user = await findUserByEmail(input.email, t);
  if (!user) throw new UnauthorizedError('Email atau password salah');

  const isMatch = await comparePassword(input.password, user.password);
  if (!isMatch) throw new UnauthorizedError('Email atau password salah');

  return {
    ...generateTokenPair({ user_id: user.id, email: user.email, role: user.role, username: user.username }),
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
    },
  };
};
