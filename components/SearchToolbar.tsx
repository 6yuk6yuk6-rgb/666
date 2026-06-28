"use client";

import { useEffect, useRef, useState } from "react";
import { Grid2X2, List, Search } from "lucide-react";

import { SORT_OPTIONS } from "@/lib/constants";
import type { Category, PromptQuery } from "@/lib/types";

type SearchToolbarProps = {
  categories: Category[];
  filters: PromptQuery;
  viewMode: "card" | "list";
  onViewModeChange: (viewMode: "card" | "list") => void;
  onQueryChange: (updates: Partial<PromptQuery>) => void;
};

export default function SearchToolbar({
  categories,
  filters,
  viewMode,
  onViewModeChange,
  onQueryChange
}: SearchToolbarProps) {
  const [searchValue, setSearchValue] = useState(filters.search ?? "");
  const firstRender = useRef(true);

  useEffect(() => {
    setSearchValue(filters.search ?? "");
  }, [filters.search]);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    const timer = window.setTimeout(() => {
      onQueryChange({ search: searchValue, page: 1 });
    }, 420);

    return () => window.clearTimeout(timer);
  }, [onQueryChange, searchValue]);

  return (
    <div className="search-toolbar" aria-label="프롬프트 검색과 정렬">
      <label>
        <span>카테고리</span>
        <select
          onChange={(event) =>
            onQueryChange({
              category: event.target.value || undefined,
              page: 1
            })
          }
          value={filters.category ?? ""}
        >
          <option value="">모든 카테고리</option>
          {categories.map((category) => (
            <option key={category.id} value={category.name}>
              {category.name}
            </option>
          ))}
        </select>
      </label>
      <label className="search-input-label">
        <span>제목 검색</span>
        <div className="input-with-icon">
          <Search size={16} />
          <input
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="제목으로 검색"
            type="search"
            value={searchValue}
          />
        </div>
      </label>
      <label>
        <span>정렬</span>
        <select
          onChange={(event) =>
            onQueryChange({
              sort: event.target.value as PromptQuery["sort"],
              page: 1
            })
          }
          value={filters.sort}
        >
          {SORT_OPTIONS.map((sort) => (
            <option key={sort.value} value={sort.value}>
              {sort.label}
            </option>
          ))}
        </select>
      </label>
      <div className="view-toggle" aria-label="보기 방식">
        <button
          aria-pressed={viewMode === "card"}
          className={viewMode === "card" ? "active" : ""}
          onClick={() => onViewModeChange("card")}
          title="카드형"
          type="button"
        >
          <Grid2X2 size={17} />
          <span>카드형</span>
        </button>
        <button
          aria-pressed={viewMode === "list"}
          className={viewMode === "list" ? "active" : ""}
          onClick={() => onViewModeChange("list")}
          title="목록형"
          type="button"
        >
          <List size={18} />
          <span>목록형</span>
        </button>
      </div>
    </div>
  );
}
