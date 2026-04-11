import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

function Spinner({ className, text = "Loading..." }) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm",
        className
      )}
    >
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-black" />
        {text && <p className="text-sm text-gray-700">{text}</p>}
      </div>
    </div>
  );
}

export default Spinner;