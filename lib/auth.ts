import "server-only";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const SECRET = process.env.JWT_SECRET || "dev-secret-inseguro";
export const TOKEN_COOKIE = "album_token";
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 días

export type SessionUser = {
  userId: string;
  email: string;
  role: "USER" | "ADMIN" | string;
  name: string;
};

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function signToken(user: SessionUser): string {
  return jwt.sign(user, SECRET, { expiresIn: TOKEN_TTL_SECONDS });
}

export function verifyToken(token: string): SessionUser | null {
  try {
    const d = jwt.verify(token, SECRET) as jwt.JwtPayload & SessionUser;
    if (!d.userId) return null;
    return { userId: d.userId, email: d.email, role: d.role, name: d.name };
  } catch {
    return null;
  }
}

/** Sesión desde la cookie (Server Components / Server Actions). */
export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(TOKEN_COOKIE)?.value;
  return token ? verifyToken(token) : null;
}

/**
 * Sesión desde una Request (route handlers).
 * Acepta `Authorization: Bearer <token>` (Flutter) o la cookie (web).
 */
export function getSessionFromRequest(req: Request): SessionUser | null {
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    const fromBearer = verifyToken(auth.slice(7).trim());
    if (fromBearer) return fromBearer;
  }
  const cookieHeader = req.headers.get("cookie");
  if (cookieHeader) {
    const entry = cookieHeader
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith(`${TOKEN_COOKIE}=`));
    if (entry) {
      return verifyToken(decodeURIComponent(entry.slice(TOKEN_COOKIE.length + 1)));
    }
  }
  return null;
}

export const COOKIE_MAX_AGE = TOKEN_TTL_SECONDS;
