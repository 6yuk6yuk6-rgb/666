import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type { EditableSection } from "@/lib/types";

export async function getOrCreateCategory(name: string) {
  const trimmedName = name.trim();

  if (!trimmedName) {
    throw new Error("카테고리를 입력해 주세요.");
  }

  const supabase = getSupabaseAdmin();
  const { data: existing, error: existingError } = await supabase
    .from("categories")
    .select("id, name, created_at")
    .eq("name", trimmedName)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existing) {
    return existing;
  }

  const { data, error } = await supabase
    .from("categories")
    .insert({ name: trimmedName })
    .select("id, name, created_at")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export function normalizeSections(sections: EditableSection[]) {
  return sections
    .map((section, index) => ({
      section_name: section.section_name.trim(),
      content: section.content.trim(),
      sort_order: index + 1
    }))
    .filter((section) => section.section_name || section.content);
}

export function validatePromptPayload(payload: {
  title: string;
  categoryName: string;
  basePrompt: string;
  sections: ReturnType<typeof normalizeSections>;
}) {
  if (!payload.title) {
    throw new Error("제목을 입력해 주세요.");
  }

  if (!payload.categoryName) {
    throw new Error("카테고리를 선택하거나 새로 입력해 주세요.");
  }

  if (!payload.basePrompt) {
    throw new Error("Base Prompt를 입력해 주세요.");
  }

  const hasIncompleteSection = payload.sections.some(
    (section) => !section.section_name || !section.content
  );

  if (hasIncompleteSection) {
    throw new Error("추가 프롬프트는 이름과 내용을 모두 입력해 주세요.");
  }
}
