import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { signSession, verifySession, type SessionPayload } from "./jwt";

export const SESSION_COOKIE = "advancia_session";

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 10);
}
export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

export async function setSession(payload: SessionPayload) {
  const token = await signSession(payload);
  cookies().set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
  return token;
}

export function clearSession() {
  cookies().delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionPayload | null> {
  const c = cookies().get(SESSION_COOKIE);
  return verifySession(c?.value);
}

export function requireRole(session: SessionPayload | null, roles: SessionPayload["role"][]) {
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!roles.includes(session.role)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  return null;
}
