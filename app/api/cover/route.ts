import { NextResponse } from "next/server";

import { getString, jsonError } from "@/lib/api-utils";
import { COVER_TITLE, PLACEHOLDER_COVER_IMAGE } from "@/lib/constants";
import { requireAdmin } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import {
  deleteStorageImage,
  isUploadFile,
  uploadImage
} from "@/lib/storage";
import type { CoverSettings } from "@/lib/types";

export const runtime = "nodejs";

const imageFields = [
  "main_image_url",
  "chibi_image_1_url",
  "chibi_image_2_url",
  "chibi_image_3_url",
  "chibi_image_4_url",
  "chibi_image_5_url"
] as const;

const fileFields = [
  "mainImage",
  "chibiImage1",
  "chibiImage2",
  "chibiImage3",
  "chibiImage4",
  "chibiImage5"
] as const;

export async function PUT(request: Request) {
  if (!(await requireAdmin())) {
    return jsonError("관리자만 사용할 수 있습니다.", 401);
  }

  try {
    const formData = await request.formData();
    const supabase = getSupabaseAdmin();
    const { data: existing, error: existingError } = await supabase
      .from("cover_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    if (existingError) {
      throw new Error(existingError.message);
    }

    const nextValues: Record<string, string | null> = {
      main_image_url:
        existing?.main_image_url ?? PLACEHOLDER_COVER_IMAGE,
      chibi_image_1_url: existing?.chibi_image_1_url ?? null,
      chibi_image_2_url: existing?.chibi_image_2_url ?? null,
      chibi_image_3_url: existing?.chibi_image_3_url ?? null,
      chibi_image_4_url: existing?.chibi_image_4_url ?? null,
      chibi_image_5_url: existing?.chibi_image_5_url ?? null
    };

    for (let index = 0; index < imageFields.length; index += 1) {
      const imageField = imageFields[index];
      const fileField = fileFields[index];
      const file = formData.get(fileField);
      const remove = getString(formData, `${fileField}Remove`) === "true";
      const previous = (existing as CoverSettings | null)?.[imageField] ?? null;

      if (isUploadFile(file)) {
        nextValues[imageField] = await uploadImage(file, "cover");
        await deleteStorageImage(previous);
      } else if (remove) {
        nextValues[imageField] =
          imageField === "main_image_url" ? PLACEHOLDER_COVER_IMAGE : null;
        await deleteStorageImage(previous);
      }
    }

    const { error } = await supabase.from("cover_settings").upsert({
      id: 1,
      title: COVER_TITLE,
      ...nextValues
    });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "커버 저장에 실패했습니다.",
      400
    );
  }
}
