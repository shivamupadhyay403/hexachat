// components/ui/Avatar.jsx
// Reusable avatar with initials fallback and size variants

const sizeMap = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
  xl: "h-20 w-20 text-xl",
};

const colorMap = [
  "bg-violet-100 text-violet-700",
  "bg-emerald-100 text-emerald-700",
  "bg-rose-100 text-rose-700",
  "bg-sky-100 text-sky-700",
  "bg-amber-100 text-amber-700",
];

function getColor(name = "") {
  const index = name.charCodeAt(0) % colorMap.length;
  return colorMap[index];
}

export default function Avatar({ src, name = "", size = "md", className = "" }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const sizeClass = sizeMap[size] || sizeMap.md;
  const colorClass = getColor(name);

  return (
    <div className={`relative flex-shrink-0 rounded-full overflow-hidden ${sizeClass} ${className}`}>
      {src ? (
        <img
          src={src}
          alt={name}
          className="w-full h-full object-cover"
        />
      ) : (
        <div
          className={`w-full h-full flex items-center justify-center font-semibold rounded-full ${colorClass}`}
        >
          {initials || "?"}
        </div>
      )}
    </div>
  );
}
