import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const BCRYPT_ROUNDS = 12;

// ---------- password helpers ----------

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function verifyPassword(
  plain: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// ---------- JWT helpers ----------

export interface TokenPayload {
  id: number;
  role: "DEV" | "ADMIN" | "USER";
  companyId: number | null;
}

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }
  return new TextEncoder().encode(secret);
}

export async function createToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(getSecret());
}

export async function verifyToken(
  token: string
): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

// ---------- request auth helpers ----------

/**
 * Extract the authenticated user from the request.
 * Checks the `token` cookie first, then `Authorization: Bearer` header.
 */
export async function getAuthUser(
  request: Request
): Promise<TokenPayload | null> {
  // 1. Try cookie
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get("token")?.value;
  if (cookieToken) {
    const payload = await verifyToken(cookieToken);
    if (payload) return payload;
  }

  // 2. Try Authorization header
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const headerToken = authHeader.slice(7);
    const payload = await verifyToken(headerToken);
    if (payload) return payload;
  }

  return null;
}

/**
 * Require authentication. Returns user payload or throws a Response.
 */
export async function requireAuth(request: Request): Promise<TokenPayload> {
  const user = await getAuthUser(request);
  if (!user) {
    throw new Response(JSON.stringify({ error: "Authentication required" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return user;
}

/**
 * Require one of the listed roles.
 */
export async function requireRole(
  request: Request,
  roles: ("DEV" | "ADMIN" | "USER")[]
): Promise<TokenPayload> {
  const user = await requireAuth(request);
  if (!roles.includes(user.role)) {
    throw new Response(JSON.stringify({ error: "Insufficient permissions" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }
  return user;
}
