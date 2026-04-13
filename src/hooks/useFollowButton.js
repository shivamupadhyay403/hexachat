// hooks/useFollowButton.js
// Use this hook on any profile page / user card for follow/unfollow/block/privacy
// ═══════════════════════════════════════════════════════════════════════════════

import { useState } from "react";
import api from "@/assets/api";

/**
 * @param {object} targetUser  - { _id, isPrivate, followers, followRequests }
 * @param {string} myId        - logged-in user's id
 */
export function useFollowButton(targetUser, myId) {
  const alreadyFollowing = targetUser?.followers?.map(String).includes(String(myId));
  const requestSent      = targetUser?.followRequests?.map(String).includes(String(myId));

  const [status,  setStatus]  = useState(
    alreadyFollowing ? "following" : requestSent ? "requested" : "none"
  );
  const [loading, setLoading] = useState(false);

  const follow = async () => {
    setLoading(true);
    try {
      const { data } = await api.post("/social/follow", { userIdToFollow: targetUser._id });
      setStatus(data.data.status); // "following" or "requested"
    } catch {}
    finally { setLoading(false); }
  };

  const unfollow = async () => {
    setLoading(true);
    try {
      await api.post("/social/unfollow", { userIdToUnfollow: targetUser._id });
      setStatus("none");
    } catch {}
    finally { setLoading(false); }
  };

  const block = async () => {
    setLoading(true);
    try {
      await api.post("/social/block", { userIdToBlock: targetUser._id });
      setStatus("blocked");
    } catch {}
    finally { setLoading(false); }
  };

  const label   = status === "following" ? "Following" : status === "requested" ? "Requested" : "Follow";
  const variant = status === "following" ? "outline" : status === "requested" ? "outline" : "default";

  return { status, loading, follow, unfollow, block, label, variant };
}
