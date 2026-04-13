import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { X } from "lucide-react";
import { fetchFollowers, fetchFollowing, removeFollower, unfollowUser } from "@/store/slices/followSlice";
import Avatar from "../ui/Avatar";

export function FollowModal({ defaultTab = "followers", onClose }) {
  const dispatch = useDispatch();
  const { followers, following } = useSelector((s) => s.follow);
  const [tab, setTab] = useState(defaultTab);

  useEffect(() => {
    dispatch(fetchFollowers());
    dispatch(fetchFollowing());
  }, [dispatch]);

  const list = tab === "followers" ? followers : following;

  const handleAction = (userId) => {
    if (tab === "followers") dispatch(removeFollower(userId));
    else dispatch(unfollowUser(userId));
  };

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-background w-full max-w-sm rounded-t-2xl sm:rounded-2xl border border-border overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex gap-1">
            {["followers", "following"].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors capitalize ${
                  tab === t
                    ? "bg-muted font-medium text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {t}
                <span className="ml-1 text-muted-foreground font-normal">
                  {t === "followers" ? followers.length : following.length}
                </span>
              </button>
            ))}
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-muted">
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>

        {/* List */}
        <div className="overflow-y-auto max-h-72 divide-y divide-border">
          {list.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-10">
              No {tab} yet
            </p>
          ) : (
            list.map((user) => (
              <div key={user._id} className="flex items-center gap-3 px-4 py-3">
                <Avatar name={`${user.firstname} ${user.lastname}`} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {user.firstname} {user.lastname}
                  </p>
                  <p className="text-xs text-muted-foreground">@{user.username}</p>
                </div>
                <button
                  onClick={() => handleAction(user._id)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                    tab === "followers"
                      ? "border-red-300 text-red-500 hover:bg-red-50"
                      : "border-border text-foreground hover:bg-muted"
                  }`}
                >
                  {tab === "followers" ? "Remove" : "Unfollow"}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}