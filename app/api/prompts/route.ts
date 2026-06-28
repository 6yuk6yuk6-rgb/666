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
import { isUploadFile, uploadImage } from "@/lib/storage";
import type { EditableSection } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!(await requireAdmin())) {
    return jsonError("관리자만 사용할 수 있습니다.", 401);
  }

  try {
    const formData = await request.formData();
    const title = getString(formData, "title");
    const categoryName = getString(formData, "categoryName");
    const basePrompt = getString(formData, "basePrompt");
    const sections = normalizeSections(
      parseJsonField<EditableSection[]>(formData, "sections", [])
    );

    validatePromptPayload({ title, categoryName, basePrompt, sections });

    const category = await getOrCreateCategory(categoryName);
    const imageFile = formData.get("image");
    const imageUrl = isUploadFile(imageFile)
      ? await uploadImage(imageFile, "prompts")
      : PLACEHOLDER_PROMPT_IMAGE;

    const supabase = getSupabaseAdmin();
    const { data: prompt, error: promptError } = await supabase
      .from("prompts")
      .insert({
        title,
        category_id: category.id,
        base_prompt: basePrompt,
        image_url: imageUrl
      })
      .select("id")
      .single();

    if (promptError) {
      throw new Error(promptError.message);
    }

    if (sections.length > 0) {
      const { error: sectionsError } = await supabase
        .from("prompt_sections")
        .insert(
          sections.map((section) => ({
            ...section,
            prompt_id: prompt.id
          }))
        );

      if (sectionsError) {
        throw new Error(sectionsError.message);
      }
    }

    return NextResponse.json({ ok: true, id: prompt.id });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "프롬프트 저장에 실패했습니다.",
      400
    );
  }
}
