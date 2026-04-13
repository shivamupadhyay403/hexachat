// ═══════════════════════════════════════════════════════════════════════════════
// components/PrivacyToggle.jsx
// Reads real isPrivate from user hook, persists via API
// ═══════════════════════════════════════════════════════════════════════════════
import { useState } from "react";
import { Loader2, Lock, Globe } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import api from "@/assets/api";

export function PrivacyToggle({ isUserPrivate = false }) {
  const [isPrivate, setIsPrivate] = useState(isUserPrivate);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    setLoading(true);
    try {
      const { data } = await api.patch("/social/privacy");
      setIsPrivate(data.data.isPrivate);
    } catch (err) {
      console.error(
        "Privacy toggle failed:",
        err.response?.data?.message ?? err.message,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="rounded-2xl border border-border shadow-none">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          {/* Icon + text */}
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                isPrivate
                  ? "bg-violet-100 dark:bg-violet-900/30 text-violet-600"
                  : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600"
              }`}
            >
              {isPrivate ? <Lock size={16} /> : <Globe size={16} />}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {isPrivate ? "Private account" : "Public account"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isPrivate
                  ? "Only approved followers can see your posts"
                  : "Anyone can view your posts and profile"}
              </p>
            </div>
          </div>

          {/* Toggle switch */}
          <button
            onClick={toggle}
            disabled={loading}
            className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
              isPrivate ? "bg-violet-600" : "bg-muted"
            } disabled:opacity-60`}
            aria-label="Toggle account privacy"
          >
            {loading ? (
              <Loader2
                size={12}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin text-white"
              />
            ) : (
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                  isPrivate ? "translate-x-5" : "translate-x-0"
                }`}
              />
            )}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
