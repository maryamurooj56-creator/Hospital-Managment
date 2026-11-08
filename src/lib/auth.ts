import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { UserRole } from "@/db/schema";
import { ApiError } from "@/lib/errors";
import { USER_ROLES } from "@/lib/constants";

export const SESSION_COOKIE = "carewell_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export type SessionUser = {
  id: number;
  email: string;
  name: string;
  role: UserRole;
};

export type SessionAccount = {
  id: number;
  email: string;
  fullName: string;
  role: UserRole;
};

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "carewell-local-development-secret-change-me",
);

export async function createSessionToken(account: SessionAccount): Promise<string> {
  return new SignJWT({
    email: account.email,
    name: account.fullName,
    role: account.role,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(String(account.id))
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    const id = Number(payload.sub);
    const role = payload.role;
    if (
      !Number.isInteger(id) ||
      typeof payload.email !== "string" ||
      typeof payload.name !== "string" ||
      typeof role !== "string" ||
      !USER_ROLES.includes(role as UserRole)
    ) {
      return null;
    }
    return { id, email: payload.email, name: payload.name, role: role as UserRole };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return token ? verifySessionToken(token) : null;
}

export function assertSession(session: SessionUser | null): SessionUser {
  if (!session) throw new ApiError(401, "Please sign in to continue");
  return session;
}

export function assertRole(session: SessionUser | null, roles: readonly UserRole[]): SessionUser {
  const current = assertSession(session);
  if (!roles.includes(current.role)) {
    throw new ApiError(403, "You do not have permission to perform this action");
  }
  return current;
}

export async function attachSessionCookie(response: NextResponse, account: SessionAccount): Promise<NextResponse> {
  const token = await createSessionToken(account);
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return response;
}

export function clearSessionCookie(response: NextResponse): NextResponse {
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}

export function roleHome(role: UserRole): string {
  if (role === "admin") return "/admin";
  if (role === "doctor") return "/doctor";
  return "/patient";
}
