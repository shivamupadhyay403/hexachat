// components/ui/NavButton.jsx
// Sidebar navigation button — active state, icon + label

export default function NavButton({ icon: Icon, label, active = false, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
        transition-all duration-150 group
        ${
          active
            ? "bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
            : "text-muted-foreground hover:bg-accent hover:text-foreground"
        }
      `}
    >
      <Icon
        size={17}
        className={`flex-shrink-0 ${
          active
            ? "text-violet-600 dark:text-violet-400"
            : "text-muted-foreground group-hover:text-foreground"
        }`}
      />
      <span>{label}</span>
      {active && (
        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-500" />
      )}
    </button>
  );
}
