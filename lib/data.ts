import "server-only";

import {
  COVER_TITLE,
  PLACEHOLDER_COVER_IMAGE,
  PLACEHOLDER_PROFILE_IMAGE,
  PROMPTS_PER_PAGE,
  type SortValue
} from "@/lib/constants";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type {
  Category,
  CoverSettings,
  Profile,
  Prompt,
  PromptListResult,
  PromptQuery,
  PromptSection
} from "@/lib/types";

type PromptRow = Omit<Prompt, "category" | "sections"> & {
  categories: Category | Category[] | null;
  prompt_sections: PromptSection[] | null;
};

const sortMap: Record<
  SortValue,
  { column: "created_at" | "updated_at" | "title"; ascending: boolean }
> = {
  recent: { column: "created_at", ascending: false },
  updated: { column: "updated_at", ascending: false },
  old: { column: "created_at", ascending: true },
  title_asc: { column: "title", ascending: true },
  title_desc: { column: "title", ascending: false }
};

export function normalizeQuery(input: {
  category?: string | string[];
  search?: string | string[];
  sort?: string | string[];
  page?: string | string[];
}): PromptQuery {
  const category = firstValue(input.category)?.trim();
  const search = firstValue(input.search)?.trim();
  const sortValue = firstValue(input.sort);
  const pageValue = Number(firstValue(input.page) ?? "1");
  const sort: SortValue = isSortValue(sortValue) ? sortValue : "recent";

  return {
    category: category || undefined,
    search: search || undefined,
    sort,
    page: Number.isFinite(pageValue) && pageValue > 0 ? Math.floor(pageValue) : 1
  };
}

function firstValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function isSortValue(value?: string): value is SortValue {
  return Boolean(
    value &&
      ["recent", "updated", "old", "title_asc", "title_desc"].includes(value)
  );
}

function mapPrompt(row: PromptRow): Prompt {
  const category = Array.isArray(row.categories)
    ? row.categories[0] ?? null
    : row.categories;

  return {
    id: row.id,
    title: row.title,
    image_url: row.image_url,
    category_id: row.category_id,
    category,
    base_prompt: row.base_prompt,
    created_at: row.created_at,
    updated_at: row.updated_at,
    sections: (row.prompt_sections ?? []).sort(
      (a, b) => a.sort_order - b.sort_order
    )
  };
}

export async function getCategories() {
  const { data, error } = await getSupabaseAdmin()
    .from("categories")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Category[];
}

export async function getPromptList(query: PromptQuery): Promise<PromptListResult> {
  const supabase = getSupabaseAdmin();
  let categoryId: string | undefined;

  if (query.category) {
    const { data: category, error: categoryError } = await supabase
      .from("categories")
      .select("id")
      .eq("name", query.category)
      .maybeSingle();

    if (categoryError) {
      throw new Error(categoryError.message);
    }

    categoryId = category?.id;

    if (!categoryId) {
      return {
        prompts: [],
        total: 0,
        totalPages: 1,
        page: 1
      };
    }
  }

  const sort = sortMap[query.sort];
  const requestedPage = Math.max(1, query.page);
  const from = (requestedPage - 1) * PROMPTS_PER_PAGE;
  const to = from + PROMPTS_PER_PAGE - 1;

  let request = supabase
    .from("prompts")
    .select(
      `
        id,
        title,
        image_url,
        category_id,
        base_prompt,
        created_at,
        updated_at,
        categories (
          id,
          name,
          created_at
        ),
        prompt_sections (
          id,
          prompt_id,
          section_name,
          content,
          sort_order,
          created_at,
          updated_at
        )
      `,
      { count: "exact" }
    );

  if (categoryId) {
    request = request.eq("category_id", categoryId);
  }

  if (query.search) {
    request = request.ilike("title", `%${query.search}%`);
  }

  const { data, error, count } = await request
    .order(sort.column, { ascending: sort.ascending })
    .order("sort_order", {
      ascending: true,
      foreignTable: "prompt_sections"
    })
    .range(from, to);

  if (error) {
    throw new Error(error.message);
  }

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PROMPTS_PER_PAGE));

  if (total > 0 && requestedPage > totalPages) {
    return getPromptList({
      ...query,
      page: totalPages
    });
  }

  return {
    prompts: ((data ?? []) as unknown as PromptRow[]).map(mapPrompt),
    total,
    totalPages,
    page: Math.min(requestedPage, totalPages)
  };
}

export async function getProfile(): Promise<Profile> {
  const { data, error } = await getSupabaseAdmin()
    .from("profile")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (
    data ?? {
      id: 1,
      profile_image_url: PLACEHOLDER_PROFILE_IMAGE,
      status_text: "( ˘͈ ᵕ ˘͈ )",
      message: "오늘도 작은 프롬프트를 정리하는 중",
      updated_at: new Date().toISOString()
    }
  ) as Profile;
}

export async function getCoverSettings(): Promise<CoverSettings> {
  const { data, error } = await getSupabaseAdmin()
    .from("cover_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (
    data ?? {
      id: 1,
      title: COVER_TITLE,
      main_image_url: PLACEHOLDER_COVER_IMAGE,
      chibi_image_1_url: null,
      chibi_image_2_url: null,
      chibi_image_3_url: null,
      chibi_image_4_url: null,
      chibi_image_5_url: null,
      updated_at: new Date().toISOString()
    }
  ) as CoverSettings;
}
