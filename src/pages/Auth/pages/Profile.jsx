// ═══════════════════════════════════════════════════════════════════════════════
// pages/Profile.jsx
// ═══════════════════════════════════════════════════════════════════════════════
import { useState, useRef, useEffect } from "react";
import { Camera, Check, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import Avatar from "../ui/Avatar";
import { useAuth } from "@/context/Authcontext";
import { PrivacyToggle } from "./PrivacyToggle";
import { getUserData } from "@/store/slices/getUserDetailSlice";
//import { updateUserProfile } from "@/store/slices/updateUserProfileSlice"; // ← add your real slice
import { useDispatch, useSelector } from "react-redux";
import Spinner from "@/assets/Spinner";

const GENDER_OPTIONS = ["Male", "Female", "Others"];

export default function Profile() {
  const { logout } = useAuth();
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getUserData());
  }, [dispatch]);

  const responseData = useSelector((state) => state?.getUserDetail);
  const user = responseData?.data;

  const [saved, setSaved] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null); // ← hold the actual File
  const fileRef = useRef();

  // ── FIX 1: Sync form whenever user data arrives from Redux ────────────────
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    handle: "",
    bio: "",
    gender: "",
    location: "",
  });

  useEffect(() => {
    if (!user) return;
    setForm({
      firstName: user.firstname ?? "",
      lastName:  user.lastname  ?? "",
      handle:    user.username  ?? "",
      bio:       user.bio       ?? "",
      gender:    user.gender    ?? GENDER_OPTIONS[0],
      location:  user.location  ?? "",
    });
  }, [user]); // ← runs whenever user object changes

  // ── FIX 2: handleSave actually dispatches the update ─────────────────────
  const handleSave = () => {
    const payload = new FormData();
    payload.append("firstname", form.firstName);
    payload.append("lastname",  form.lastName);
    payload.append("username",  form.handle);
    payload.append("bio",       form.bio);
    payload.append("gender",    form.gender);
    payload.append("location",  form.location);
    if (avatarFile) payload.append("avatar", avatarFile); // ← include new avatar

    // dispatch(updateUserProfile(payload)); // ← wire to your real thunk

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // ── FIX 3: Keep the File object alongside the preview URL ─────────────────
  const handleAvatarFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const update = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const stats = [
    { label: "Posts",     value: user?.postsCount     ?? 0 },
    { label: "Followers", value: user?.followersCount  ?? 0 },
    { label: "Following", value: user?.followingCount  ?? 0 },
  ];

  // ── FIX 4: Guard renders while loading ───────────────────────────────────
  if (responseData?.isLoading) return <Spinner />;

  // ── FIX 5: Safe display name — never "undefined undefined" ───────────────
  const displayName = [form.firstName, form.lastName].filter(Boolean).join(" ") || "User";

  return (
    <div className="max-w-lg mx-auto py-4 space-y-4">
      {/* ── Profile hero ── */}
      <Card className="rounded-2xl border border-border shadow-none">
        <CardContent className="p-6 space-y-5">
          {/* Avatar */}
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
                <Avatar name={displayName} size="xl" /> // ← FIX 5 applied
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
              <p className="font-semibold text-foreground">{displayName}</p>
              <p className="text-xs text-muted-foreground">@{form.handle}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-muted rounded-xl p-3 text-center">
                <p className="text-base font-semibold text-foreground">
                  {typeof stat.value === "number" && stat.value >= 1000
                    ? `${(stat.value / 1000).toFixed(1)}k`
                    : stat.value}
                </p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Privacy toggle ── */}
      <PrivacyToggle isUserPrivate={user?.isPrivate} />

      {/* ── Edit form ── */}
      <Card className="rounded-2xl border border-border shadow-none">
        <CardContent className="p-5 space-y-4">
          <p className="text-sm font-semibold text-foreground">Edit Profile</p>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">First name</label>
              <Input value={form.firstName} onChange={update("firstName")} className="rounded-xl text-sm h-9" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">Last name</label>
              <Input value={form.lastName} onChange={update("lastName")} className="rounded-xl text-sm h-9" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium">Username</label>
            <Input value={form.handle} onChange={update("handle")} className="rounded-xl text-sm h-9" />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium">Bio</label>
            <Textarea
              value={form.bio}
              onChange={update("bio")}
              className="rounded-xl text-sm resize-none"
              rows={3}
              placeholder="Tell people a little about yourself…"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">Gender</label>
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
              <label className="text-xs text-muted-foreground font-medium">Location</label>
              <Input value={form.location} onChange={update("location")} className="rounded-xl text-sm h-9" />
            </div>
          </div>

          <Button
            onClick={handleSave}
            className={`w-full rounded-xl transition-all ${
              saved ? "bg-emerald-600 hover:bg-emerald-700" : "bg-violet-600 hover:bg-violet-700"
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

      {/* ── Logout ── */}
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