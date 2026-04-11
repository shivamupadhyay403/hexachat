import { cn } from "@/lib/utils";
import { Loader2Icon } from "lucide-react";

function Spinner({ className, text = "Loading..." }) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-sm",
        className,
      )}
    >
      <div className="flex flex-col items-center gap-2">
        <Loader2Icon
          role="status"
          aria-label="Loading"
          className="size-8 animate-spin text-black"
        />
        <p className="text-sm text-gray-700">{text}</p>
      </div>
    </div>
  );
}

export { Spinner };
