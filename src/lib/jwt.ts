import { SignJWT, jwtVerify, type JWTPayload } from "jose";

const secret = () => new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret-please-change");

export type SessionPayload = {
  sub: string;
  email: string;
  role: "user" | "admin" | "super_admin";
  name?: string;
};

export async function signSession(payload: SessionPayload, expires = "7d") {
  return await new SignJWT(payload as unknown as JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expires)
    .sign(secret());
}

export async function verifySession(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}
