import "server-only";

import { ADMIN_USERNAME_FALLBACK } from "@/lib/constants";

const BCRYPT_HASH_PATTERN = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

export class EnvConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EnvConfigError";
  }
}

export function getAdminUsername() {
  return process.env.ADMIN_USERNAME?.trim() || ADMIN_USERNAME_FALLBACK;
}

export function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new EnvConfigError(`${name} 환경변수가 설정되지 않았습니다.`);
  }

  return value;
}

export function getAdminPasswordHash() {
  const rawValue = getRequiredEnv("ADMIN_PASSWORD_HASH");
  const hash = decodeAdminPasswordHash(rawValue);

  if (!BCRYPT_HASH_PATTERN.test(hash)) {
    throw new EnvConfigError(
      "ADMIN_PASSWORD_HASH가 올바른 bcrypt 해시 형식이 아닙니다. npm run hash-password가 출력하는 base64 값을 사용하는 것을 권장합니다."
    );
  }

  return hash;
}

function decodeAdminPasswordHash(value: string) {
  const normalized = value.trim().replace(/\\\$/g, "$");

  if (BCRYPT_HASH_PATTERN.test(normalized)) {
    return normalized;
  }

  try {
    const decoded = Buffer.from(normalized, "base64").toString("utf8").trim();

    if (BCRYPT_HASH_PATTERN.test(decoded)) {
      return decoded;
    }
  } catch {
    return normalized;
  }

  return normalized;
}
