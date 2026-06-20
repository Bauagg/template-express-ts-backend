import jwt from 'jsonwebtoken';

export interface JwtPayload {
  user_id: string;
  email: string;
  role: string;
  username: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
}

const SECRET = process.env.JWT_SECRET;
const EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '15m';

const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN ?? '7d';

if (!SECRET) throw new Error('JWT_SECRET tidak ditemukan di .env');
if (!REFRESH_SECRET) throw new Error('JWT_REFRESH_SECRET tidak ditemukan di .env');

export const signToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN } as jwt.SignOptions);
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, SECRET) as JwtPayload;
};

export const signRefreshToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN } as jwt.SignOptions);
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  return jwt.verify(token, REFRESH_SECRET) as JwtPayload;
};

// generate access_token + refresh_token sekaligus, bisa dipakai di service manapun
export const generateTokenPair = (payload: JwtPayload): TokenPair => ({
  access_token: signToken(payload),
  refresh_token: signRefreshToken(payload),
});

// tukar refresh_token yang valid → access_token baru, bisa dipakai di service manapun
export const refreshAccessToken = (refreshToken: string): { access_token: string } => {
  const decoded = verifyRefreshToken(refreshToken);
  return {
    access_token: signToken({
      user_id: decoded.user_id,
      email: decoded.email,
      role: decoded.role,
      username: decoded.username,
    }),
  };
};
