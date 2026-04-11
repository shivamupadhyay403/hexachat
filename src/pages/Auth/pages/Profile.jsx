// pages/Profile.jsx
// User profile editor — avatar upload, personal info fields, stats

import { useState, useRef } from "react";
import { Camera, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import Avatar from "../ui/Avatar";
import useUser from "@/hooks/useUser";
import { LogOut } from "lucide-react";
import { useAuth } from "@/context/Authcontext";
const GENDER_OPTIONS = ["Male", "Female", "Non-binary", "Prefer not to say"];

const STATS = [
  { label: "Posts", value: 48 },
  { label: "Followers", value: "1.2k" },
  { label: "Following", value: 230 },
];

export default function Profile() {
  const { logout } = useAuth();
  const { getUserFirstName, getUserLastName, getUserGender, getUserName } =
    useUser();
  const [form, setForm] = useState({
    firstName: getUserFirstName(),
    lastName: getUserLastName(),
    handle: getUserName(),
    bio: "Building things on the internet. Coffee addict ☕",
    gender: getUserGender(),
    location: "Varanasi, India",
    website: "",
  });
  const [saved, setSaved] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileRef = useRef();

  const update = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleAvatarFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setAvatarPreview(URL.createObjectURL(file));
  };

  return (
    <div className="max-w-lg mx-auto py-4 space-y-4">
      {/* Profile hero card */}
      <Card className="rounded-2xl border border-border shadow-none">
        <CardContent className="p-6 space-y-5">
          {/* Avatar upload */}
          <div className="flex flex-col items-center gap-3">
            <div
              className="relative group cursor-pointer"
              onClick={() => fileRef.current.click()}
            >
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar"
                  className="w-20 h-20 rounded-full object-cover border-2 border-border"
                />
              ) : (
                <Avatar name={`${form.firstName} ${form.lastName}`} size="xl" />
              )}
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={18} className="text-white" />
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleAvatarFile(e.target.files[0])}
              />
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground">
                {form.firstName} {form.lastName}
              </p>
              <p className="text-xs text-muted-foreground">{form.handle}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="bg-muted rounded-xl p-3 text-center"
              >
                <p className="text-base font-semibold text-foreground">
                  {stat.value}
                </p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit form */}
      <Card className="rounded-2xl border border-border shadow-none">
        <CardContent className="p-5 space-y-4">
          <p className="text-sm font-semibold text-foreground">Edit Profile</p>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">
                First name
              </label>
              <Input
                value={form.firstName}
                onChange={update("firstName")}
                className="rounded-xl text-sm h-9"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">
                Last name
              </label>
              <Input
                value={form.lastName}
                onChange={update("lastName")}
                className="rounded-xl text-sm h-9"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium">
              Username
            </label>
            <Input
              value={form.handle}
              onChange={update("handle")}
              className="rounded-xl text-sm h-9"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium">
              Bio
            </label>
            <Textarea
              value={form.bio}
              onChange={update("bio")}
              className="rounded-xl text-sm resize-none"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">
                Gender
              </label>
              <select
                value={form.gender}
                onChange={update("gender")}
                className="w-full h-9 rounded-xl border border-input bg-background text-sm px-3 text-foreground"
              >
                {GENDER_OPTIONS.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">
                Location
              </label>
              <Input
                value={form.location}
                onChange={update("location")}
                className="rounded-xl text-sm h-9"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium">
              Website
            </label>
            <Input
              value={form.website}
              onChange={update("website")}
              placeholder="https://yoursite.com"
              className="rounded-xl text-sm h-9"
            />
          </div>

          <Button
            onClick={handleSave}
            className={`w-full rounded-xl transition-all ${
              saved
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-violet-600 hover:bg-violet-700"
            } text-white`}
          >
            {saved ? (
              <span className="flex items-center gap-2">
                <Check size={15} /> Saved!
              </span>
            ) : (
              "Save Profile"
            )}
          </Button>
        </CardContent>
      </Card>
      <div className="px-1">
        <Button
          variant="outline"
          onClick={logout}
          className="w-full rounded-xl border-red-300 text-red-500 hover:bg-red-50 flex items-center justify-center gap-2"
        >
          <LogOut size={16} />
          Logout
        </Button>
      </div>
    </div>
  );
}
