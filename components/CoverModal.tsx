"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { ImagePlus, Loader2, X } from "lucide-react";

import type { CoverSettings } from "@/lib/types";

type CoverModalProps = {
  open: boolean;
  cover: CoverSettings;
  onClose: () => void;
  onSaved: () => void;
  onToast: (message: string, tone?: "success" | "error") => void;
};

type CoverSlot = {
  fileField: string;
  removeField: string;
  label: string;
  current: string | null;
};

const slotKeys = [
  "mainImage",
  "chibiImage1",
  "chibiImage2",
  "chibiImage3",
  "chibiImage4",
  "chibiImage5"
] as const;

export default function CoverModal({
  open,
  cover,
  onClose,
  onSaved,
  onToast
}: CoverModalProps) {
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [previews, setPreviews] = useState<Record<string, string | null>>({});
  const [removes, setRemoves] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const slots: CoverSlot[] = useMemo(
    () => [
      {
        fileField: "mainImage",
        removeField: "mainImageRemove",
        label: "메인 커버 사진",
        current: cover.main_image_url
      },
      {
        fileField: "chibiImage1",
        removeField: "chibiImage1Remove",
        label: "치비 이미지 1",
        current: cover.chibi_image_1_url
      },
      {
        fileField: "chibiImage2",
        removeField: "chibiImage2Remove",
        label: "치비 이미지 2",
        current: cover.chibi_image_2_url
      },
      {
        fileField: "chibiImage3",
        removeField: "chibiImage3Remove",
        label: "치비 이미지 3",
        current: cover.chibi_image_3_url
      },
      {
        fileField: "chibiImage4",
        removeField: "chibiImage4Remove",
        label: "치비 이미지 4",
        current: cover.chibi_image_4_url
      },
      {
        fileField: "chibiImage5",
        removeField: "chibiImage5Remove",
        label: "치비 이미지 5",
        current: cover.chibi_image_5_url
      }
    ],
    [cover]
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const initialPreviews: Record<string, string | null> = {};
    const initialFiles: Record<string, File | null> = {};
    const initialRemoves: Record<string, boolean> = {};

    slots.forEach((slot) => {
      initialPreviews[slot.fileField] = slot.current;
      initialFiles[slot.fileField] = null;
      initialRemoves[slot.fileField] = false;
      const input = inputRefs.current[slot.fileField];

      if (input) {
        input.value = "";
      }
    });

    setPreviews(initialPreviews);
    setFiles(initialFiles);
    setRemoves(initialRemoves);
    setError("");
    setLoading(false);
  }, [open, slots]);

  if (!open) {
    return null;
  }

  const handleFileChange =
    (field: string) => (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];

      if (!file) {
        return;
      }

      setFiles((current) => ({ ...current, [field]: file }));
      setPreviews((current) => ({ ...current, [field]: URL.createObjectURL(file) }));
      setRemoves((current) => ({ ...current, [field]: false }));
    };

  const removeSlot = (field: string) => {
    setFiles((current) => ({ ...current, [field]: null }));
    setPreviews((current) => ({ ...current, [field]: null }));
    setRemoves((current) => ({ ...current, [field]: true }));

    const input = inputRefs.current[field];
    if (input) {
      input.value = "";
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData();

    slotKeys.forEach((field) => {
      const file = files[field];

      if (file) {
        formData.append(field, file);
      }

      formData.append(`${field}Remove`, String(Boolean(removes[field])));
    });

    const response = await fetch("/api/cover", {
      method: "PUT",
      body: formData
    });
    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
    };

    setLoading(false);

    if (!response.ok) {
      setError(data.error ?? "커버 저장에 실패했습니다.");
      onToast("커버 저장에 실패했습니다.", "error");
      return;
    }

    window.sessionStorage.removeItem("oracle-cover-entered");
    onToast("커버를 저장했습니다.");
    onSaved();
    onClose();
  };

  return (
    <div className="modal-backdrop" role="presentation">
      <section
        aria-labelledby="cover-form-title"
        aria-modal="true"
        className="modal-card large-modal"
        role="dialog"
      >
        <button
          aria-label="닫기"
          className="icon-button modal-close"
          onClick={onClose}
          type="button"
        >
          <X size={18} />
        </button>
        <div className="modal-kicker">Cover</div>
        <h2 id="cover-form-title">커버 편집</h2>
        <form className="form-stack" onSubmit={handleSubmit}>
          <div className="cover-slot-grid">
            {slots.map((slot) => (
              <div className="cover-slot-editor" key={slot.fileField}>
                <div className="slot-preview">
                  {previews[slot.fileField] ? (
                    <img
                      alt={`${slot.label} 미리보기`}
                      src={previews[slot.fileField] ?? ""}
                    />
                  ) : (
                    <span>♥</span>
                  )}
                </div>
                <div className="slot-controls">
                  <strong>{slot.label}</strong>
                  <label className="file-button">
                    <ImagePlus size={16} />
                    이미지 선택
                    <input
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileChange(slot.fileField)}
                      ref={(element) => {
                        inputRefs.current[slot.fileField] = element;
                      }}
                      type="file"
                    />
                  </label>
                  <button
                    className="soft-button ghost"
                    onClick={() => removeSlot(slot.fileField)}
                    type="button"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
          <small className="form-hint">
            치비 이미지는 투명 PNG를 올리면 배경 없이 배치됩니다.
          </small>
          {error ? <p className="form-error">{error}</p> : null}
          <div className="modal-actions">
            <button className="soft-button ghost" onClick={onClose} type="button">
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
