import "server-only";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { jwtVerify, SignJWT } from "jose";

import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS
} from "@/lib/constants";
import { getAdminUsername, getRequiredEnv } from "@/lib/env";

type AdminSession = {
  role: "admin";
  username: string;
};

function getSecretKey() {
  const secret = getRequiredEnv("SESSION_SECRET");
  return new TextEncoder().encode(secret);
}

export async function createAdminSessionToken() {
  return new SignJWT({
    role: "admin",
    username: getAdminUsername()
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifyAdminToken(token?: string) {
  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getSecretKey());

    if (
      payload.role === "admin" &&
      payload.username === getAdminUsername()
    ) {
      return payload as AdminSession;
    }
  } catch {
    return null;
  }

  return null;
}

export async function getAdminSession() {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  return verifyAdminToken(token);
}

export async function isAdminRequest() {
  return Boolean(await getAdminSession());
}

export async function requireAdmin() {
  const session = await getAdminSession();

  if (!session) {
    return false;
  }

  return true;
}

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });
}
