"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";

import type { Profile } from "@/lib/types";

type ProfileModalProps = {
  open: boolean;
  profile: Profile;
  onClose: () => void;
  onSaved: () => void;
  onToast: (message: string, tone?: "success" | "error") => void;
};

export default function ProfileModal({
  open,
  profile,
  onClose,
  onSaved,
  onToast
}: ProfileModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [statusText, setStatusText] = useState("");
  const [message, setMessage] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [removeImage, setRemoveImage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    setStatusText(profile.status_text);
    setMessage(profile.message);
    setImagePreview(profile.profile_image_url);
    setImageFile(null);
    setRemoveImage(false);
    setError("");
    setLoading(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [open, profile]);

  if (!open) {
    return null;
  }

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setRemoveImage(false);
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview("");
    setRemoveImage(true);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("statusText", statusText.trim());
    formData.append("message", message.trim());
    formData.append("removeImage", String(removeImage));

    if (imageFile) {
      formData.append("image", imageFile);
    }

    const response = await fetch("/api/profile", {
      method: "PUT",
      body: formData
    });
    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
    };

    setLoading(false);

    if (!response.ok) {
      setError(data.error ?? "프로필 저장에 실패했습니다.");
      onToast("프로필 저장에 실패했습니다.", "error");
      return;
    }

    onToast("프로필을 저장했습니다.");
    onSaved();
    onClose();
  };

  return (
    <div className="modal-backdrop" role="presentation">
      <section
        aria-labelledby="profile-form-title"
        aria-modal="true"
        className="modal-card small-modal"
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
        <div className="modal-kicker">Profile</div>
        <h2 id="profile-form-title">프로필 수정</h2>
        <form className="form-stack" onSubmit={handleSubmit}>
          <div className="image-field compact">
            <div className="image-preview avatar-preview">
              {imagePreview ? (
                <img alt="프로필 사진 미리보기" src={imagePreview} />
              ) : (
                <span>Profile</span>
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
              <button className="soft-button ghost" onClick={clearImage} type="button">
                삭제
              </button>
            </div>
          </div>
          <label>
            상태 문구
            <input
              onChange={(event) => setStatusText(event.target.value)}
              placeholder="( ˘͈ ᵕ ˘͈ )"
              required
              type="text"
              value={statusText}
            />
          </label>
          <label>
            한 줄 메시지
            <input
              onChange={(event) => setMessage(event.target.value)}
              placeholder="오늘의 상태"
              required
              type="text"
              value={message}
            />
          </label>
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
