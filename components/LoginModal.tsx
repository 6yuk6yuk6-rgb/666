"use client";

import { FormEvent, useEffect, useState } from "react";
import { Loader2, LockKeyhole, X } from "lucide-react";

type LoginModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default function LoginModal({
  open,
  onClose,
  onSuccess
}: LoginModalProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setError("");
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username, password })
    });

    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
    };

    setLoading(false);

    if (!response.ok) {
      setError(data.error ?? "아이디 또는 비밀번호를 확인해 주세요.");
      return;
    }

    setPassword("");
    onSuccess();
  };

  return (
    <div className="modal-backdrop" role="presentation">
      <section
        aria-labelledby="login-title"
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
        <div className="modal-kicker">
          <LockKeyhole size={16} />
          관리자 로그인
        </div>
        <h2 id="login-title">잠금 해제</h2>
        <form className="form-stack" onSubmit={handleSubmit}>
          <label>
            아이디
            <input
              autoComplete="username"
              name="username"
              onChange={(event) => setUsername(event.target.value)}
              placeholder="관리자 아이디"
              required
              type="text"
              value={username}
            />
          </label>
          <label>
            비밀번호
            <input
              autoComplete="current-password"
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="비밀번호"
              required
              type="password"
              value={password}
            />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <div className="modal-actions">
            <button
              className="soft-button ghost"
              onClick={onClose}
              type="button"
            >
              닫기
            </button>
            <button className="soft-button primary" disabled={loading}>
              {loading ? <Loader2 className="spin" size={16} /> : null}
              로그인
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
