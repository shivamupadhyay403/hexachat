// pages/FindPeople.jsx
import { useEffect, useState } from "react";
import { UserPlus, MessageCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Avatar from "../ui/Avatar";
import { useDispatch, useSelector } from "react-redux";
import { getUsers } from "@/store/slices/getAllUsersSlice";
import { useNavigate } from "react-router-dom";
import Spinner from "@/assets/Spinner";

function PeopleCard({ user }) {
  const [followed, setFollowed] = useState(false);
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
            {user.firstname + " " + user.lastname}
          </p>
          <p className="text-xs text-muted-foreground">{user.username}</p>
        </div>

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">
            {user.followersCount.toLocaleString()}
          </span>
          followers
        </div>

        <div className="grid grid-cols-3 gap-1 w-full">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 rounded-lg bg-muted" style={{ opacity: 1 - i * 0.2 }} />
          ))}
        </div>

        <div className="flex gap-2 w-full">
          <Button
            size="sm"
            variant={followed ? "outline" : "default"}
            className={`flex-1 rounded-xl text-xs h-8 ${
              followed
                ? "border-violet-300 text-violet-600"
                : "bg-violet-600 hover:bg-violet-700 text-white"
            }`}
            onClick={() => setFollowed((f) => !f)}
          >
            <UserPlus size={13} className="mr-1" />
            {followed ? "Following" : "Follow"}
          </Button>
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
  const dispatch = useDispatch();

  useEffect(() => { dispatch(getUsers()); }, [dispatch]);

  const responseData = useSelector((state) => state?.getAllUsers);

  const filtered = (responseData?.data || []).filter(
    (u) =>
      u.username.toLowerCase().includes(query.toLowerCase()) ||
      u.email.toLowerCase().includes(query.toLowerCase())
  );

  if (responseData?.isLoading) return <Spinner />;

  return (
    <div className="py-4 space-y-5">
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or role..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-8 rounded-xl text-sm h-9"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {filtered.map((user) => (
          <PeopleCard key={user._id} user={user} />
        ))}
      </div>

      {!responseData?.isLoading && filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground text-sm">
          No users found for "{query}"
        </div>
      )}
    </div>
  );
}