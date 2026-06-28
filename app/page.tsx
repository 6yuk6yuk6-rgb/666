import PromptArchiveClient from "@/components/PromptArchiveClient";
import { isAdminRequest } from "@/lib/auth";
import {
  getCategories,
  getCoverSettings,
  getProfile,
  getPromptList,
  normalizeQuery
} from "@/lib/data";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: {
    category?: string | string[];
    search?: string | string[];
    sort?: string | string[];
    page?: string | string[];
  };
};

export default async function Home({ searchParams }: PageProps) {
  const query = normalizeQuery(searchParams);
  const [promptResult, categories, profile, cover, isAdmin] = await Promise.all([
    getPromptList(query),
    getCategories(),
    getProfile(),
    getCoverSettings(),
    isAdminRequest()
  ]);

  return (
    <PromptArchiveClient
      categories={categories}
      cover={cover}
      filters={query}
      isAdmin={isAdmin}
      profile={profile}
      promptResult={promptResult}
    />
  );
}
