import { useEffect, useState } from "react";
import { UserPlus, UserCheck, Loader2, MessageCircle, Search, Clock } from "lucide-react";
import { Input }             from "@/components/ui/input";
import { Button }            from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Avatar                from "../ui/Avatar";
import { useDispatch, useSelector } from "react-redux";
import { getUsers }          from "@/store/slices/getAllUsersSlice";
import { useNavigate }       from "react-router-dom";
import Spinner               from "@/assets/Spinner";
import api                   from "@/assets/api";
import useUser               from "@/hooks/useUser";
 
function FollowButton({ user, myId }) {
  const myIdStr  = String(myId);
 
  // Derive initial state from API data (works once Fix 1 is applied)
  const isFollowing  = user.followers?.map(String).includes(myIdStr);
  const isRequested  = user.followRequests?.map(String).includes(myIdStr);
 
  const [status,  setStatus]  = useState(
    isFollowing ? "following" : isRequested ? "requested" : "none"
  );
  const [loading, setLoading] = useState(false);
 
  const handleClick = async () => {
    if (loading) return;
    setLoading(true);
    try {
      if (status === "none") {
        // Follow or request (backend decides based on isPrivate)
        const { data } = await api.post("/social/follow", { userIdToFollow: user._id });
        // data.data.status === "following" (public) or "requested" (private)
        setStatus(data.data.status);
 
      } else if (status === "requested") {
        // Cancel own pending request
        await api.post("/social/follow/reject", { requesterId: myId });
        setStatus("none");
 
      } else if (status === "following") {
        // Unfollow
        await api.post("/social/unfollow", { userIdToUnfollow: user._id });
        setStatus("none");
      }
    } catch (err) {
      console.error("Follow action failed:", err.response?.data?.message ?? err.message);
    } finally {
      setLoading(false);
    }
  };
 
  const configs = {
    none: {
      label:   "Follow",
      icon:    <UserPlus size={13} />,
      classes: "bg-violet-600 hover:bg-violet-700 text-white border-transparent",
    },
    requested: {
      label:   "Requested",
      icon:    <Clock size={13} />,
      classes: "border border-violet-300 text-violet-600 bg-transparent hover:bg-violet-50 dark:hover:bg-violet-900/20",
    },
    following: {
      label:   "Following",
      icon:    <UserCheck size={13} />,
      classes: "border border-border text-foreground bg-transparent hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200 dark:hover:bg-rose-900/10",
    },
  };
 
  const cfg = configs[status] ?? configs.none;
 
  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`flex-1 rounded-xl text-xs h-8 flex items-center justify-center gap-1.5 font-medium transition-all border ${cfg.classes} disabled:opacity-60`}
    >
      {loading
        ? <Loader2 size={13} className="animate-spin" />
        : <>{cfg.icon}{cfg.label}</>
      }
    </button>
  );
}
 
function PeopleCard({ user, myId }) {
  const navigate    = useNavigate();
  const onlineUsers = useSelector((s) => s.onlineUsers);
  const isOnline    = !!onlineUsers[user._id];
 
  const handleMessage = () => {
    navigate("/dashboard/chats", {
      state: {
        initContact: {
          id:       user._id,
          name:     `${user.firstname} ${user.lastname}`,
          username: user.username,
          online:   isOnline,
        },
      },
    });
  };
 
  const followerCount = user.followersCount ?? user.followers?.length ?? 0;
 
  return (
    <Card className="rounded-2xl border border-border shadow-none hover:shadow-sm transition-shadow">
      <CardContent className="p-4 flex flex-col items-center gap-3">
        <div className="relative">
          <Avatar name={user.username} size="xl" />
          {isOnline && (
            <span className="absolute bottom-1 right-1 w-3 h-3 bg-emerald-500 border-2 border-background rounded-full" />
          )}
        </div>
 
        <div className="text-center">
          <p className="text-sm font-semibold text-foreground">
            {user.firstname} {user.lastname}
          </p>
          <p className="text-xs text-muted-foreground">@{user.username}</p>
          {user.isPrivate && (
            <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              🔒 Private
            </span>
          )}
        </div>
 
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">
            {followerCount.toLocaleString()}
          </span>{" "}
          followers
        </div>
 
        <div className="grid grid-cols-3 gap-1 w-full">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 rounded-lg bg-muted" style={{ opacity: 1 - i * 0.2 }} />
          ))}
        </div>
 
        <div className="flex gap-2 w-full">
          <FollowButton user={user} myId={myId} />
          <Button
            size="sm"
            variant="outline"
            onClick={handleMessage}
            className="rounded-xl h-8 w-8 p-0 flex-shrink-0"
          >
            <MessageCircle size={13} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
 
export default function FindPeople() {
  const [query, setQuery] = useState("");
  const dispatch  = useDispatch();
  const { getUserId } = useUser();
  const myId = String(getUserId());
 
  useEffect(() => { dispatch(getUsers()); }, [dispatch]);
 
  const responseData = useSelector((state) => state?.getAllUsers);
 
  const filtered = (responseData?.data || []).filter((u) =>
    u.username?.toLowerCase().includes(query.toLowerCase()) ||
    u.email?.toLowerCase().includes(query.toLowerCase()) ||
    `${u.firstname} ${u.lastname}`.toLowerCase().includes(query.toLowerCase())
  );
 
  if (responseData?.isLoading) return <Spinner />;
 
  return (
    <div className="py-4 space-y-5">
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or username..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-8 rounded-xl text-sm h-9"
        />
      </div>
 
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {filtered.map((user) => (
          <PeopleCard key={user._id} user={user} myId={myId} />
        ))}
      </div>
 
      {!responseData?.isLoading && filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground text-sm">
          No users found{query ? ` for "${query}"` : ""}
        </div>
      )}
    </div>
  );
}
 