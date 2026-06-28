import { NextResponse } from "next/server";

import { getString, jsonError, parseJsonField } from "@/lib/api-utils";
import { PLACEHOLDER_PROMPT_IMAGE } from "@/lib/constants";
import { requireAdmin } from "@/lib/auth";
import {
  getOrCreateCategory,
  normalizeSections,
  validatePromptPayload
} from "@/lib/mutations";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import {
  deleteStorageImage,
  isUploadFile,
  uploadImage
} from "@/lib/storage";
import type { EditableSection } from "@/lib/types";

export const runtime = "nodejs";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!(await requireAdmin())) {
    return jsonError("관리자만 사용할 수 있습니다.", 401);
  }

  try {
    const formData = await request.formData();
    const title = getString(formData, "title");
    const categoryName = getString(formData, "categoryName");
    const basePrompt = getString(formData, "basePrompt");
    const removeImage = getString(formData, "removeImage") === "true";
    const sections = normalizeSections(
      parseJsonField<EditableSection[]>(formData, "sections", [])
    );

    validatePromptPayload({ title, categoryName, basePrompt, sections });

    const supabase = getSupabaseAdmin();
    const { data: existing, error: existingError } = await supabase
      .from("prompts")
      .select("id, image_url")
      .eq("id", params.id)
      .single();

    if (existingError) {
      throw new Error(existingError.message);
    }

    const category = await getOrCreateCategory(categoryName);
    const imageFile = formData.get("image");
    let imageUrl = existing.image_url;

    if (isUploadFile(imageFile)) {
      imageUrl = await uploadImage(imageFile, "prompts");
      await deleteStorageImage(existing.image_url);
    } else if (removeImage) {
      imageUrl = PLACEHOLDER_PROMPT_IMAGE;
      await deleteStorageImage(existing.image_url);
    }

    const { error: updateError } = await supabase
      .from("prompts")
      .update({
        title,
        category_id: category.id,
        base_prompt: basePrompt,
        image_url: imageUrl
      })
      .eq("id", params.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    const { error: deleteSectionsError } = await supabase
      .from("prompt_sections")
      .delete()
      .eq("prompt_id", params.id);

    if (deleteSectionsError) {
      throw new Error(deleteSectionsError.message);
    }

    if (sections.length > 0) {
      const { error: insertSectionsError } = await supabase
        .from("prompt_sections")
        .insert(
          sections.map((section) => ({
            ...section,
            prompt_id: params.id
          }))
        );

      if (insertSectionsError) {
        throw new Error(insertSectionsError.message);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "프롬프트 수정에 실패했습니다.",
      400
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  if (!(await requireAdmin())) {
    return jsonError("관리자만 사용할 수 있습니다.", 401);
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data: existing, error: existingError } = await supabase
      .from("prompts")
      .select("id, image_url")
      .eq("id", params.id)
      .single();

    if (existingError) {
      throw new Error(existingError.message);
    }

    const { error: deleteError } = await supabase
      .from("prompts")
      .delete()
      .eq("id", params.id);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    await deleteStorageImage(existing.image_url);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "프롬프트 삭제에 실패했습니다.",
      400
    );
  }
}
