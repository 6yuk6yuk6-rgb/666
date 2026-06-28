import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { createAdminSessionToken, setSessionCookie } from "@/lib/auth";
import {
  EnvConfigError,
  getAdminPasswordHash,
  getAdminUsername
} from "@/lib/env";

export const runtime = "nodejs";

const LOGIN_ERROR = "아이디 또는 비밀번호를 확인해 주세요.";
const CONFIG_ERROR = "관리자 환경변수 설정을 확인해 주세요.";

export async function POST(request: Request) {
  try {
    let body: {
      username?: string;
      password?: string;
    };

    try {
      body = (await request.json()) as {
        username?: string;
        password?: string;
      };
    } catch {
      return NextResponse.json({ error: LOGIN_ERROR }, { status: 400 });
    }

    const username = body.username?.trim() ?? "";
    const password = body.password ?? "";
    const adminUsername = getAdminUsername();
    const passwordHash = getAdminPasswordHash();

    if (username !== adminUsername) {
      await bcrypt.compare(password || "x", passwordHash);
      return NextResponse.json({ error: LOGIN_ERROR }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, passwordHash);

    if (!isValid) {
      return NextResponse.json({ error: LOGIN_ERROR }, { status: 401 });
    }

    const token = await createAdminSessionToken();
    const response = NextResponse.json({ ok: true });
    setSessionCookie(response, token);
    return response;
  } catch (error) {
    if (error instanceof EnvConfigError) {
      console.error(error.message);
      return NextResponse.json({ error: CONFIG_ERROR }, { status: 500 });
    }

    console.error(error);
    return NextResponse.json({ error: CONFIG_ERROR }, { status: 500 });
  }
}
