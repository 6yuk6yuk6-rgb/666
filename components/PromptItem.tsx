"use client";

import { useMemo, useState } from "react";
import { Clipboard, Pencil, Trash2 } from "lucide-react";

import { PLACEHOLDER_PROMPT_IMAGE } from "@/lib/constants";
import type { Prompt } from "@/lib/types";

type PromptItemProps = {
  prompt: Prompt;
  viewMode: "card" | "list";
  isAdmin: boolean;
  editMode: boolean;
  onEdit: (prompt: Prompt) => void;
  onDelete: (prompt: Prompt) => void;
  onToast: (message: string, tone?: "success" | "error") => void;
};

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "medium"
});

function buildCopyText(prompt: Prompt) {
  const chunks = ["Base Prompt", prompt.base_prompt];

  prompt.sections
    .sort((a, b) => a.sort_order - b.sort_order)
    .forEach((section) => {
      chunks.push("", section.section_name, section.content);
    });

  return chunks.join("\n");
}

function fallbackCopy(text: string) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  const ok = document.execCommand("copy");
  document.body.removeChild(textarea);
  return ok;
}

export default function PromptItem({
  prompt,
  viewMode,
  isAdmin,
  editMode,
  onEdit,
  onDelete,
  onToast
}: PromptItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyText = useMemo(() => buildCopyText(prompt), [prompt]);
  const isLong = copyText.length > 520;

  const copyPrompt = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(copyText);
      } else if (!fallbackCopy(copyText)) {
        throw new Error("fallback failed");
      }
    } catch {
      if (!fallbackCopy(copyText)) {
        onToast("클립보드 복사에 실패했습니다.", "error");
        return;
      }
    }

    setCopied(true);
    onToast("프롬프트를 복사했습니다.");
    window.setTimeout(() => setCopied(false), 1300);
  };

  return (
    <article className={`prompt-item prompt-${viewMode}`}>
      <div className="prompt-image-frame">
        <img
          alt={`${prompt.title} 대표 이미지`}
          src={prompt.image_url || PLACEHOLDER_PROMPT_IMAGE}
        />
      </div>
      <div className="prompt-content">
        <div className="prompt-head">
          <div>
            <span className="category-badge">
              {prompt.category?.name ?? "미분류"}
            </span>
            <h2>{prompt.title}</h2>
          </div>
          {isAdmin && editMode ? (
            <div className="item-actions">
              <button
                aria-label={`${prompt.title} 수정`}
                className="icon-button"
                onClick={() => onEdit(prompt)}
                type="button"
              >
                <Pencil size={16} />
              </button>
              <button
                aria-label={`${prompt.title} 삭제`}
                className="icon-button danger-icon"
                onClick={() => onDelete(prompt)}
                type="button"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ) : null}
        </div>
        <div className={`prompt-text ${expanded ? "expanded" : ""}`}>
          <section>
            <h3>Base Prompt</h3>
            <p>{prompt.base_prompt}</p>
          </section>
          {prompt.sections.map((section) => (
            <section key={section.id}>
              <h3>{section.section_name}</h3>
              <p>{section.content}</p>
            </section>
          ))}
        </div>
        {isLong ? (
          <button
            className="text-link-button"
            onClick={() => setExpanded((value) => !value)}
            type="button"
          >
            {expanded ? "접기" : "펼쳐보기"}
          </button>
        ) : null}
        <div className="prompt-footer">
          <span>등록 {dateFormatter.format(new Date(prompt.created_at))}</span>
          <button className="copy-button" onClick={copyPrompt} type="button">
            <Clipboard size={15} />
            {copied ? "C♥pied!" : "C♥py"}
          </button>
        </div>
      </div>
    </article>
  );
}
