// pages/Post.jsx
import { useState, useRef } from "react";
import { ImagePlus, X, Tag, Loader2 } from "lucide-react";
import { Button }                      from "@/components/ui/button";
import { Card, CardContent }           from "@/components/ui/card";
import { Textarea }                    from "@/components/ui/textarea";
import Avatar                          from "../ui/Avatar";
import api                             from "@/assets/api";

const SUGGESTED_TAGS = ["#design", "#code", "#lifestyle", "#travel", "#tech", "#photo"];

export default function Post({ currentUser = { name: "Arjun Kumar" }, onPostCreated }) {
  const [content,      setContent]      = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [dragOver,     setDragOver]     = useState(false);
  const [preview,      setPreview]      = useState(null);   // blob URL for preview
  const [imageFile,    setImageFile]    = useState(null);   // actual File
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState(null);
  const [success,      setSuccess]      = useState(false);
  const fileRef = useRef();

  const toggleTag = (tag) =>
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );

  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const clearForm = () => {
    setContent("");
    setPreview(null);
    setImageFile(null);
    setSelectedTags([]);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!content.trim() && !imageFile) return;
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("content", content.trim());
      formData.append("tags",    JSON.stringify(selectedTags));
      if (imageFile) formData.append("image", imageFile);

      const { data } = await api.post("/posts", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSuccess(true);
      clearForm();
      setTimeout(() => setSuccess(false), 3000);
      onPostCreated?.(data.data); // bubble up to feed if needed
    } catch (err) {
      setError(err.response?.data?.message ?? "Failed to publish post");
    } finally {
      setLoading(false);
    }
  };

  const charLimit = 280;
  const remaining = charLimit - content.length;

  return (
    <div className="max-w-xl mx-auto py-4 space-y-4">
      <Card className="rounded-2xl border border-border shadow-none">
        <CardContent className="p-5 space-y-4">

          {/* Author row */}
          <div className="flex items-center gap-3">
            <Avatar name={currentUser.name} size="md" />
            <div>
              <p className="text-sm font-semibold text-foreground">{currentUser.name}</p>
              <p className="text-xs text-muted-foreground">Posting publicly</p>
            </div>
          </div>

          {/* Success banner */}
          {success && (
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-4 py-2.5 text-sm text-emerald-700 dark:text-emerald-400">
              ✅ Post published successfully!
            </div>
          )}

          {/* Error banner */}
          {error && (
            <div className="rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 px-4 py-2.5 text-sm text-rose-600 dark:text-rose-400">
              ⚠️ {error}
            </div>
          )}

          {/* Textarea */}
          <div className="relative">
            <Textarea
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, charLimit))}
              className="resize-none min-h-[100px] rounded-xl text-sm pr-10"
              disabled={loading}
            />
            <span className={`absolute bottom-3 right-3 text-xs font-medium ${
              remaining <= 20 ? "text-rose-500" : "text-muted-foreground"
            }`}>
              {remaining}
            </span>
          </div>

          {/* Image upload zone / preview */}
          {preview ? (
            <div className="relative rounded-xl overflow-hidden">
              <img src={preview} alt="Preview" className="w-full h-52 object-cover" />
              <button
                className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition"
                onClick={() => { setPreview(null); setImageFile(null); }}
                disabled={loading}
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current.click()}
              className={`h-36 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${
                dragOver
                  ? "border-violet-400 bg-violet-50 dark:bg-violet-900/20"
                  : "border-border hover:border-violet-300 hover:bg-accent"
              }`}
            >
              <ImagePlus size={22} className="text-muted-foreground" strokeWidth={1.5} />
              <p className="text-xs text-muted-foreground">
                Drag & drop or <span className="text-violet-600 font-medium">browse</span>
              </p>
              <p className="text-[10px] text-muted-foreground">PNG, JPG up to 10MB</p>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFile(e.target.files[0])}
              />
            </div>
          )}

          {/* Tags */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Tag size={13} className="text-muted-foreground" />
              <p className="text-xs text-muted-foreground font-medium">Add tags</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  disabled={loading}
                  className={`text-xs px-3 py-1 rounded-full border transition-all ${
                    selectedTags.includes(tag)
                      ? "bg-violet-600 text-white border-violet-600"
                      : "border-border text-muted-foreground hover:border-violet-300 hover:text-foreground"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-1">
            <Button
              className="flex-1 bg-violet-600 hover:bg-violet-700 text-white rounded-xl"
              disabled={(!content.trim() && !imageFile) || loading}
              onClick={handleSubmit}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" /> Publishing…
                </span>
              ) : "Publish Post"}
            </Button>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={clearForm}
              disabled={loading}
            >
              Clear
            </Button>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}