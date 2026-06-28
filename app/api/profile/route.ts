import { NextResponse } from "next/server";

import { getString, jsonError } from "@/lib/api-utils";
import { PLACEHOLDER_PROFILE_IMAGE } from "@/lib/constants";
import { requireAdmin } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import {
  deleteStorageImage,
  isUploadFile,
  uploadImage
} from "@/lib/storage";

export const runtime = "nodejs";

export async function PUT(request: Request) {
  if (!(await requireAdmin())) {
    return jsonError("관리자만 사용할 수 있습니다.", 401);
  }

  try {
    const formData = await request.formData();
    const statusText = getString(formData, "statusText");
    const message = getString(formData, "message");
    const removeImage = getString(formData, "removeImage") === "true";

    if (!statusText || !message) {
      return jsonError("상태 문구와 한 줄 메시지를 입력해 주세요.", 400);
    }

    const supabase = getSupabaseAdmin();
    const { data: existing, error: existingError } = await supabase
      .from("profile")
      .select("profile_image_url")
      .eq("id", 1)
      .maybeSingle();

    if (existingError) {
      throw new Error(existingError.message);
    }

    const imageFile = formData.get("image");
    let profileImageUrl =
      existing?.profile_image_url ?? PLACEHOLDER_PROFILE_IMAGE;

    if (isUploadFile(imageFile)) {
      profileImageUrl = await uploadImage(imageFile, "profile");
      await deleteStorageImage(existing?.profile_image_url);
    } else if (removeImage) {
      profileImageUrl = PLACEHOLDER_PROFILE_IMAGE;
      await deleteStorageImage(existing?.profile_image_url);
    }

    const { error } = await supabase.from("profile").upsert({
      id: 1,
      status_text: statusText,
      message,
      profile_image_url: profileImageUrl
    });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "프로필 저장에 실패했습니다.",
      400
    );
  }
}
