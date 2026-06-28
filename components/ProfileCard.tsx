"use client";

import { Pencil, UserRound } from "lucide-react";

import { PLACEHOLDER_PROFILE_IMAGE } from "@/lib/constants";
import type { Profile } from "@/lib/types";

type ProfileCardProps = {
  profile: Profile;
  isAdmin: boolean;
  editMode: boolean;
  onEdit: () => void;
};

export default function ProfileCard({
  profile,
  isAdmin,
  editMode,
  onEdit
}: ProfileCardProps) {
  return (
    <aside className="profile-rail">
      <details className="profile-card" open>
        <summary>
          <span>
            <UserRound size={16} />
            프로필
          </span>
          <small>접기</small>
        </summary>
        <div className="profile-body">
          <div className="status-bubble">{profile.status_text}</div>
          <img
            alt="프로필 사진"
            className="profile-image"
            src={profile.profile_image_url || PLACEHOLDER_PROFILE_IMAGE}
          />
          <p>{profile.message}</p>
          {isAdmin && editMode ? (
            <button className="soft-button mini" onClick={onEdit} type="button">
              <Pencil size={14} />
              프로필 수정
            </button>
          ) : null}
        </div>
      </details>
    </aside>
  );
}
