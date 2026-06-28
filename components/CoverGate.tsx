"use client";

import { useCallback, useEffect, useState } from "react";

import { COVER_TITLE, PLACEHOLDER_COVER_IMAGE } from "@/lib/constants";
import type { CoverSettings } from "@/lib/types";

const chibiFields = [
  "chibi_image_1_url",
  "chibi_image_2_url",
  "chibi_image_3_url",
  "chibi_image_4_url",
  "chibi_image_5_url"
] as const;

export default function CoverGate({ cover }: { cover: CoverSettings }) {
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    try {
      if (window.sessionStorage.getItem("oracle-cover-entered") === "true") {
        setVisible(false);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  const enter = useCallback(() => {
    setLeaving(true);

    try {
      window.sessionStorage.setItem("oracle-cover-entered", "true");
    } catch {
      // The transition should still complete if browser storage is unavailable.
    }

    window.setTimeout(() => setVisible(false), 480);
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <section
      aria-label="커버"
      className={`cover-screen ${leaving ? "cover-leaving" : ""}`}
    >
      <div className="lace" aria-hidden="true" />
      <div className="cover-stage">
        <div className="cover-photo-wrap">
          <div className="photo-tape tape-top" aria-hidden="true" />
          <img
            alt="커버 메인 사진"
            className="cover-main-photo"
            src={cover.main_image_url || PLACEHOLDER_COVER_IMAGE}
          />
          <div className="photo-tape tape-bottom" aria-hidden="true" />
        </div>
        {chibiFields.map((field, index) => {
          const src = cover[field];

          return (
            <div
              aria-hidden="true"
              className={`chibi-slot chibi-${index + 1} ${
                src ? "" : "chibi-empty"
              }`}
              key={field}
            >
              {src ? (
                <img alt="" src={src} />
              ) : (
                <span>♥</span>
              )}
            </div>
          );
        })}
        <h1>{COVER_TITLE}</h1>
        <button className="enter-button" onClick={enter} type="button">
          Enter ♥
        </button>
      </div>
    </section>
  );
}
