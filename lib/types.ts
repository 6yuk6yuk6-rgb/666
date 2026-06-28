import type { SortValue } from "@/lib/constants";

export type Category = {
  id: string;
  name: string;
  created_at: string;
};

export type PromptSection = {
  id: string;
  prompt_id: string;
  section_name: string;
  content: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type Prompt = {
  id: string;
  title: string;
  image_url: string;
  category_id: string;
  category: Category | null;
  base_prompt: string;
  created_at: string;
  updated_at: string;
  sections: PromptSection[];
};

export type Profile = {
  id: number;
  profile_image_url: string;
  status_text: string;
  message: string;
  updated_at: string;
};

export type CoverSettings = {
  id: number;
  title: string;
  main_image_url: string;
  chibi_image_1_url: string | null;
  chibi_image_2_url: string | null;
  chibi_image_3_url: string | null;
  chibi_image_4_url: string | null;
  chibi_image_5_url: string | null;
  updated_at: string;
};

export type PromptQuery = {
  category?: string;
  search?: string;
  sort: SortValue;
  page: number;
};

export type PromptListResult = {
  prompts: Prompt[];
  total: number;
  totalPages: number;
  page: number;
};

export type EditableSection = {
  id?: string;
  section_name: string;
  content: string;
  sort_order: number;
};
