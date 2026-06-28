"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  Lock,
  LogOut,
  Pencil,
  Plus,
  Unlock
} from "lucide-react";

import ConfirmModal from "@/components/ConfirmModal";
import CoverGate from "@/components/CoverGate";
import CoverModal from "@/components/CoverModal";
import LoginModal from "@/components/LoginModal";
import ProfileCard from "@/components/ProfileCard";
import ProfileModal from "@/components/ProfileModal";
import PromptItem from "@/components/PromptItem";
import PromptModal from "@/components/PromptModal";
import SearchToolbar from "@/components/SearchToolbar";
import ToastHost, { type ToastMessage } from "@/components/ToastHost";
import type {
  Category,
  CoverSettings,
  Profile,
  Prompt,
  PromptListResult,
  PromptQuery
} from "@/lib/types";

type PromptArchiveClientProps = {
  categories: Category[];
  cover: CoverSettings;
  filters: PromptQuery;
  isAdmin: boolean;
  profile: Profile;
  promptResult: PromptListResult;
};

function buildPageNumbers(current: number, total: number) {
  const pages = new Set<number>([1, total, current]);

  for (let page = current - 2; page <= current + 2; page += 1) {
    if (page > 0 && page <= total) {
      pages.add(page);
    }
  }

  return Array.from(pages).sort((a, b) => a - b);
}

export default function PromptArchiveClient({
  categories,
  cover,
  filters,
  isAdmin,
  profile,
  promptResult
}: PromptArchiveClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const [editMode, setEditMode] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [promptModalOpen, setPromptModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [coverModalOpen, setCoverModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Prompt | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const storedViewMode = window.localStorage.getItem("oracle-view-mode");
    if (storedViewMode === "card" || storedViewMode === "list") {
      setViewMode(storedViewMode);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) {
      setEditMode(false);
    }
  }, [isAdmin]);

  const showToast = useCallback(
    (message: string, tone: "success" | "error" = "success") => {
      const id = Date.now() + Math.random();
      setToasts((current) => [...current, { id, message, tone }]);
      window.setTimeout(() => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
      }, 2600);
    },
    []
  );

  const updateQuery = useCallback(
    (updates: Partial<PromptQuery>) => {
      const params = new URLSearchParams(window.location.search);

      const setOrDelete = (key: string, value: string | number | undefined) => {
        const normalized = String(value ?? "").trim();

        if (!normalized) {
          params.delete(key);
        } else {
          params.set(key, normalized);
        }
      };

      if ("category" in updates) {
        setOrDelete("category", updates.category);
      }

      if ("search" in updates) {
        setOrDelete("search", updates.search);
      }

      if ("sort" in updates) {
        setOrDelete("sort", updates.sort);
      }

      if ("page" in updates) {
        setOrDelete("page", updates.page);
      }

      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false
      });

      if ("page" in updates) {
        window.setTimeout(() => {
          document
            .getElementById("prompt-list")
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 80);
      }
    },
    [pathname, router]
  );

  const setAndStoreViewMode = (nextViewMode: "card" | "list") => {
    setViewMode(nextViewMode);
    window.localStorage.setItem("oracle-view-mode", nextViewMode);
  };

  const refreshData = () => {
    router.refresh();
  };

  const openNewPrompt = () => {
    setEditingPrompt(null);
    setPromptModalOpen(true);
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setEditMode(false);
    showToast("잠금 상태로 전환했습니다.");
    router.refresh();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    setDeleteLoading(true);
    const response = await fetch(`/api/prompts/${deleteTarget.id}`, {
      method: "DELETE"
    });
    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
    };

    setDeleteLoading(false);

    if (!response.ok) {
      showToast(data.error ?? "삭제에 실패했습니다.", "error");
      return;
    }

    showToast("프롬프트를 삭제했습니다.");
    setDeleteTarget(null);
    router.refresh();
  };

  const pages = useMemo(
    () => buildPageNumbers(promptResult.page, promptResult.totalPages),
    [promptResult.page, promptResult.totalPages]
  );

  return (
    <>
      <CoverGate cover={cover} />
      <div className="site-shell">
        <header className="site-header">
          <div>
            <div className="header-kicker">
              <BookOpen size={16} />
              Prompt Archive
            </div>
            <h1>프롬프트 보관소</h1>
            <p className="count-pill">저장된 프롬프트 {promptResult.total}개</p>
          </div>
          {isAdmin ? (
            <nav className="admin-toolbar" aria-label="관리자 도구">
              <button
                aria-pressed={editMode}
                className={editMode ? "active" : ""}
                onClick={() => setEditMode((value) => !value)}
                type="button"
              >
                {editMode ? <Unlock size={16} /> : <Pencil size={16} />}
                편집 모드
              </button>
              <button onClick={() => setCoverModalOpen(true)} type="button">
                커버 편집
              </button>
              <button onClick={openNewPrompt} type="button">
                <Plus size={16} />새 프롬프트 등록
              </button>
              <button onClick={handleLogout} type="button">
                <LogOut size={16} />잠금
              </button>
            </nav>
          ) : null}
        </header>

        <main className="archive-layout">
          <ProfileCard
            editMode={editMode}
            isAdmin={isAdmin}
            onEdit={() => setProfileModalOpen(true)}
            profile={profile}
          />
          <section className="prompt-panel" id="prompt-list">
            <SearchToolbar
              categories={categories}
              filters={filters}
              onQueryChange={updateQuery}
              onViewModeChange={setAndStoreViewMode}
              viewMode={viewMode}
            />
            {promptResult.prompts.length > 0 ? (
              <div className={`prompt-list prompt-list-${viewMode}`}>
                {promptResult.prompts.map((prompt) => (
                  <PromptItem
                    editMode={editMode}
                    isAdmin={isAdmin}
                    key={prompt.id}
                    onDelete={setDeleteTarget}
                    onEdit={(selectedPrompt) => {
                      setEditingPrompt(selectedPrompt);
                      setPromptModalOpen(true);
                    }}
                    onToast={showToast}
                    prompt={prompt}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <span aria-hidden="true">♥</span>
                <h2>아직 보이는 프롬프트가 없어요</h2>
                <p>검색 조건을 바꾸거나 관리자로 로그인해 새 프롬프트를 등록하세요.</p>
              </div>
            )}
            {promptResult.totalPages > 1 ? (
              <nav className="pagination" aria-label="페이지네이션">
                <button
                  disabled={promptResult.page <= 1}
                  onClick={() =>
                    updateQuery({ page: Math.max(1, promptResult.page - 1) })
                  }
                  type="button"
                >
                  이전
                </button>
                {pages.map((page, index) => {
                  const previous = pages[index - 1];
                  const hasGap = previous && page - previous > 1;

                  return (
                    <span className="page-group" key={page}>
                      {hasGap ? <span className="page-ellipsis">...</span> : null}
                      <button
                        aria-current={
                          page === promptResult.page ? "page" : undefined
                        }
                        className={page === promptResult.page ? "active" : ""}
                        onClick={() => updateQuery({ page })}
                        type="button"
                      >
                        {page}
                      </button>
                    </span>
                  );
                })}
                <button
                  disabled={promptResult.page >= promptResult.totalPages}
                  onClick={() =>
                    updateQuery({
                      page: Math.min(
                        promptResult.totalPages,
                        promptResult.page + 1
                      )
                    })
                  }
                  type="button"
                >
                  다음
                </button>
              </nav>
            ) : null}
          </section>
        </main>
      </div>

      {!isAdmin ? (
        <button
          aria-label="관리자 로그인"
          className="quiet-lock"
          onClick={() => setLoginOpen(true)}
          title="관리자 로그인"
          type="button"
        >
          <Lock size={16} />
        </button>
      ) : null}

      <LoginModal
        onClose={() => setLoginOpen(false)}
        onSuccess={() => {
          setLoginOpen(false);
          showToast("관리자 모드로 로그인했습니다.");
          router.refresh();
        }}
        open={loginOpen}
      />
      <PromptModal
        categories={categories}
        onClose={() => setPromptModalOpen(false)}
        onSaved={refreshData}
        onToast={showToast}
        open={promptModalOpen}
        prompt={editingPrompt}
      />
      <ProfileModal
        onClose={() => setProfileModalOpen(false)}
        onSaved={refreshData}
        onToast={showToast}
        open={profileModalOpen}
        profile={profile}
      />
      <CoverModal
        cover={cover}
        onClose={() => setCoverModalOpen(false)}
        onSaved={refreshData}
        onToast={showToast}
        open={coverModalOpen}
      />
      <ConfirmModal
        confirmLabel="삭제"
        loading={deleteLoading}
        message={
          deleteTarget
            ? `"${deleteTarget.title}" 프롬프트를 삭제할까요? 삭제된 데이터는 되돌릴 수 없습니다.`
            : ""
        }
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        open={Boolean(deleteTarget)}
        title="삭제 확인"
      />
      <ToastHost toasts={toasts} />
    </>
  );
}
