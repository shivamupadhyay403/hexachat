// components/ui/UserChip.jsx
// Compact user identity block — used in sidebar footer

import Avatar from "./Avatar";
import { MoreHorizontal } from "lucide-react";

export default function UserChip({ name, handle, avatarSrc }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-accent cursor-pointer group transition-colors">
      <Avatar name={name} src={avatarSrc} size="sm" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{name}</p>
        <p className="text-xs text-muted-foreground truncate">{handle}</p>
      </div>
      <MoreHorizontal
        size={15}
        className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
      />
    </div>
  );
}
