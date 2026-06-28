import "server-only";

import { randomUUID } from "crypto";

import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_SIZE_BYTES,
  STORAGE_BUCKET
} from "@/lib/constants";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp"
};

export function isUploadFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0;
}

export function validateImageFile(file: File) {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error("JPG, PNG, WEBP 이미지만 업로드할 수 있습니다.");
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error("이미지는 5MB 이하만 업로드할 수 있습니다.");
  }
}

export async function uploadImage(file: File, folder: string) {
  validateImageFile(file);

  const supabase = getSupabaseAdmin();
  const extension = EXTENSION_BY_TYPE[file.type] ?? "bin";
  const storagePath = `${folder}/${randomUUID()}.${extension}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, bytes, {
      contentType: file.type,
      upsert: false,
      cacheControl: "3600"
    });

  if (error) {
    throw new Error(`이미지 업로드 실패: ${error.message}`);
  }

  const { data } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(storagePath);

  return data.publicUrl;
}

export function getStoragePathFromPublicUrl(url: string | null | undefined) {
  if (!url || url.startsWith("/")) {
    return null;
  }

  try {
    const parsed = new URL(url);
    const marker = `/storage/v1/object/public/${STORAGE_BUCKET}/`;
    const markerIndex = parsed.pathname.indexOf(marker);

    if (markerIndex === -1) {
      return null;
    }

    return decodeURIComponent(
      parsed.pathname.slice(markerIndex + marker.length)
    );
  } catch {
    return null;
  }
}

export async function deleteStorageImage(url: string | null | undefined) {
  const storagePath = getStoragePathFromPublicUrl(url);

  if (!storagePath) {
    return;
  }

  await getSupabaseAdmin().storage.from(STORAGE_BUCKET).remove([storagePath]);
}
