export const ADMIN_USERNAME_FALLBACK = "oracle4243";
export const SESSION_COOKIE_NAME = "oracle_admin_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
export const PROMPTS_PER_PAGE = 20;
export const STORAGE_BUCKET = "prompt-images";
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
export const PLACEHOLDER_PROMPT_IMAGE = "/placeholder-prompt.svg";
export const PLACEHOLDER_PROFILE_IMAGE = "/profile-placeholder.svg";
export const PLACEHOLDER_COVER_IMAGE = "/cover-placeholder.svg";
export const COVER_TITLE = "i LoVe Y♥U";

export const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp"
]);

export const SORT_OPTIONS = [
  { value: "recent", label: "최근 등록순" },
  { value: "updated", label: "최근 수정순" },
  { value: "old", label: "오래된순" },
  { value: "title_asc", label: "제목 가나다순" },
  { value: "title_desc", label: "제목 역순" }
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];
