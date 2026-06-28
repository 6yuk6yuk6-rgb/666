"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useRef,
  useState
} from "react";
import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  ImagePlus,
  Loader2,
  Plus,
  Trash2,
  X
} from "lucide-react";

import type { Category, EditableSection, Prompt } from "@/lib/types";

type PromptModalProps = {
  open: boolean;
  prompt: Prompt | null;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
  onToast: (message: string, tone?: "success" | "error") => void;
};

function reorderSections(sections: EditableSection[]) {
  return sections.map((section, index) => ({
    ...section,
    sort_order: index + 1
  }));
}

export default function PromptModal({
  open,
  prompt,
  categories,
  onClose,
  onSaved,
  onToast
}: PromptModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [title, setTitle] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [basePrompt, setBasePrompt] = useState("");
  const [sections, setSections] = useState<EditableSection[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [removeImage, setRemoveImage] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    setTitle(prompt?.title ?? "");
    setSelectedCategory(prompt?.category?.name ?? categories[0]?.name ?? "");
    setNewCategory("");
    setBasePrompt(prompt?.base_prompt ?? "");
    setSections(
      prompt?.sections.map((section) => ({
        id: section.id,
        section_name: section.section_name,
        content: section.content,
        sort_order: section.sort_order
      })) ?? []
    );
    setImageFile(null);
    setImagePreview(prompt?.image_url ?? "");
    setRemoveImage(false);
    setError("");
    setLoading(false);
    setDirty(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [categories, open, prompt]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        requestClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  if (!open) {
    return null;
  }

  const categoryName = newCategory.trim() || selectedCategory.trim();

  const markDirty = () => setDirty(true);

  const requestClose = () => {
    if (dirty && !window.confirm("작성 중인 내용이 있습니다. 닫을까요?")) {
      return;
    }

    onClose();
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setRemoveImage(false);
    markDirty();
  };

  const removeCurrentImage = () => {
    setImageFile(null);
    setImagePreview("");
    setRemoveImage(true);
    markDirty();

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const updateSection = (
    index: number,
    field: "section_name" | "content",
    value: string
  ) => {
    setSections((current) =>
      current.map((section, sectionIndex) =>
        sectionIndex === index ? { ...section, [field]: value } : section
      )
    );
    markDirty();
  };

  const addSection = () => {
    setSections((current) =>
      reorderSections([
        ...current,
        {
          section_name: "",
          content: "",
          sort_order: current.length + 1
        }
      ])
    );
    markDirty();
  };

  const deleteSection = (index: number) => {
    setSections((current) =>
      reorderSections(current.filter((_, sectionIndex) => sectionIndex !== index))
    );
    markDirty();
  };

  const moveSection = (from: number, to: number) => {
    setSections((current) => {
      if (to < 0 || to >= current.length) {
        return current;
      }

      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return reorderSections(next);
    });
    markDirty();
  };

  const dropSection = (to: number) => {
    if (dragIndex === null || dragIndex === to) {
      setDragIndex(null);
      return;
    }

    moveSection(dragIndex, to);
    setDragIndex(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("제목을 입력해 주세요.");
      return;
    }

    if (!categoryName) {
      setError("카테고리를 선택하거나 새로 입력해 주세요.");
      return;
    }

    if (!basePrompt.trim()) {
      setError("Base Prompt를 입력해 주세요.");
      return;
    }

    if (
      sections.some(
        (section) =>
          !section.section_name.trim() || !section.content.trim()
      )
    ) {
      setError("추가 프롬프트는 이름과 내용을 모두 입력해 주세요.");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("categoryName", categoryName);
    formData.append("basePrompt", basePrompt.trim());
    formData.append("sections", JSON.stringify(reorderSections(sections)));
    formData.append("removeImage", String(removeImage));

    if (imageFile) {
      formData.append("image", imageFile);
    }

    const endpoint = prompt ? `/api/prompts/${prompt.id}` : "/api/prompts";
    const response = await fetch(endpoint, {
      method: prompt ? "PUT" : "POST",
      body: formData
    });
    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
    };

    setLoading(false);

    if (!response.ok) {
      setError(data.error ?? "저장에 실패했습니다.");
      onToast("저장에 실패했습니다.", "error");
      return;
    }

    setDirty(false);
    onToast(prompt ? "프롬프트를 수정했습니다." : "프롬프트를 등록했습니다.");
    onSaved();
    onClose();
  };

  return (
    <div className="modal-backdrop" role="presentation">
      <section
        aria-labelledby="prompt-form-title"
        aria-modal="true"
        className="modal-card large-modal"
        role="dialog"
      >
        <button
          aria-label="닫기"
          className="icon-button modal-close"
          onClick={requestClose}
          type="button"
        >
          <X size={18} />
        </button>
        <div className="modal-kicker">Prompt Note</div>
        <h2 id="prompt-form-title">
          {prompt ? "프롬프트 수정" : "새 프롬프트 등록"}
        </h2>
        <form className="form-stack prompt-form" onSubmit={handleSubmit}>
          <div className="form-grid two">
            <label>
              제목
              <input
                onChange={(event) => {
                  setTitle(event.target.value);
                  markDirty();
                }}
                placeholder="프롬프트 제목"
                required
                type="text"
                value={title}
              />
            </label>
            <label>
              기존 카테고리
              <select
                onChange={(event) => {
                  setSelectedCategory(event.target.value);
                  markDirty();
                }}
                value={selectedCategory}
              >
                <option value="">선택 안 함</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label>
            새 카테고리 직접 입력
            <input
              onChange={(event) => {
                setNewCategory(event.target.value);
                markDirty();
              }}
              placeholder="새 카테고리를 만들 때만 입력"
              type="text"
              value={newCategory}
            />
          </label>
          <div className="image-field">
            <div className="image-preview">
              {imagePreview ? (
                <img alt="대표 사진 미리보기" src={imagePreview} />
              ) : (
                <span>대표 사진</span>
              )}
            </div>
            <div className="image-controls">
              <label className="file-button">
                <ImagePlus size={16} />
                이미지 선택
                <input
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  ref={fileInputRef}
                  type="file"
                />
              </label>
              <button
                className="soft-button ghost"
                onClick={removeCurrentImage}
                type="button"
              >
                이미지 삭제
              </button>
              <small>JPG, PNG, WEBP / 5MB 이하</small>
            </div>
          </div>
          <label>
            Base Prompt
            <textarea
              onChange={(event) => {
                setBasePrompt(event.target.value);
                markDirty();
              }}
              placeholder="기본 프롬프트를 입력하세요."
              required
              rows={7}
              value={basePrompt}
            />
          </label>
          <div className="section-list">
            <div className="section-list-head">
              <h3>추가 프롬프트</h3>
              <button
                className="soft-button sage"
                onClick={addSection}
                type="button"
              >
                <Plus size={16} /> 추가 프롬프트
              </button>
            </div>
            {sections.map((section, index) => (
              <div
                className={`section-editor ${
                  dragIndex === index ? "dragging" : ""
                }`}
                draggable
                key={`${section.id ?? "new"}-${index}`}
                onDragOver={(event) => event.preventDefault()}
                onDragStart={() => setDragIndex(index)}
                onDrop={() => dropSection(index)}
              >
                <div className="drag-handle" aria-hidden="true">
                  <GripVertical size={17} />
                </div>
                <div className="section-fields">
                  <input
                    aria-label="추가 프롬프트 이름"
                    onChange={(event) =>
                      updateSection(index, "section_name", event.target.value)
                    }
                    placeholder="예: 의상 프롬프트"
                    value={section.section_name}
                  />
                  <textarea
                    aria-label="추가 프롬프트 내용"
                    onChange={(event) =>
                      updateSection(index, "content", event.target.value)
                    }
                    placeholder="프롬프트 내용을 입력하세요."
                    rows={4}
                    value={section.content}
                  />
                </div>
                <div className="section-actions">
                  <button
                    aria-label="위로 이동"
                    className="icon-button"
                    disabled={index === 0}
                    onClick={() => moveSection(index, index - 1)}
                    type="button"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    aria-label="아래로 이동"
                    className="icon-button"
                    disabled={index === sections.length - 1}
                    onClick={() => moveSection(index, index + 1)}
                    type="button"
                  >
                    <ChevronDown size={16} />
                  </button>
                  <button
                    aria-label="추가 프롬프트 삭제"
                    className="icon-button danger-icon"
                    onClick={() => deleteSection(index)}
                    type="button"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          {error ? <p className="form-error">{error}</p> : null}
          <div className="modal-actions">
            <button
              className="soft-button ghost"
              onClick={requestClose}
              type="button"
            >
              취소
            </button>
            <button className="soft-button primary" disabled={loading}>
              {loading ? <Loader2 className="spin" size={16} /> : null}
              저장
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
