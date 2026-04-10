// pages/Feed.jsx
// Social feed with posts — like, comment, share actions

import { useState } from "react";
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, ImageIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Avatar from "../ui/Avatar";

const DUMMY_POSTS = [
  {
    id: 1,
    user: "Priya Sharma",
    handle: "@priya_s",
    time: "2h ago",
    content: "Just wrapped up our team offsite in Goa 🌊 — incredible conversations and so many new ideas on the table. Feeling recharged!",
    likes: 84,
    comments: 21,
    hasImage: true,
  },
  {
    id: 2,
    user: "Ravi Mehta",
    handle: "@ravimehta",
    time: "5h ago",
    content: "PSA: if you're not using keyboard shortcuts in VS Code, you're leaving so much productivity on the table. Here's what I use daily 👇",
    likes: 142,
    comments: 38,
    hasImage: false,
  },
  {
    id: 3,
    user: "Neha Gupta",
    handle: "@nehag",
    time: "8h ago",
    content: "Some weekend sketches from my new sketchbook. Trying to get back into daily drawing — nothing like pen on paper to clear your head.",
    likes: 57,
    comments: 14,
    hasImage: true,
  },
];

function PostCard({ post }) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes);

  const handleLike = () => {
    setLiked((prev) => !prev);
    setLikeCount((c) => (liked ? c - 1 : c + 1));
  };

  return (
    <Card className="rounded-2xl border border-border shadow-none">
      <CardContent className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar name={post.user} size="md" />
            <div>
              <p className="text-sm font-semibold text-foreground">{post.user}</p>
              <p className="text-xs text-muted-foreground">
                {post.handle} · {post.time}
              </p>
            </div>
          </div>
          <button className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-accent">
            <MoreHorizontal size={16} />
          </button>
        </div>

        {/* Content */}
        <p className="text-sm text-foreground leading-relaxed">{post.content}</p>

        {/* Image placeholder */}
        {post.hasImage && (
          <div className="h-52 bg-muted rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <ImageIcon size={28} strokeWidth={1.5} />
            <span className="text-xs">Image</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-1 border-t border-border">
          <div className="flex items-center gap-1">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                liked
                  ? "text-rose-500 bg-rose-50 dark:bg-rose-900/20"
                  : "text-muted-foreground hover:bg-accent"
              }`}
            >
              <Heart size={14} fill={liked ? "currentColor" : "none"} />
              {likeCount}
            </button>

            <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:bg-accent transition-colors">
              <MessageCircle size={14} />
              {post.comments}
            </button>

            <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:bg-accent transition-colors">
              <Share2 size={14} />
              Share
            </button>
          </div>

          <button
            onClick={() => setSaved((s) => !s)}
            className={`p-1.5 rounded-lg transition-all ${
              saved
                ? "text-violet-600 bg-violet-50 dark:bg-violet-900/20"
                : "text-muted-foreground hover:bg-accent"
            }`}
          >
            <Bookmark size={14} fill={saved ? "currentColor" : "none"} />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Feed() {
  return (
    <div className="max-w-xl mx-auto space-y-4 py-4">
      {DUMMY_POSTS.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
