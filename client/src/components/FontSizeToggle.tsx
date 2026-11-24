import { useEffect, useState } from "react";
import { ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const STORAGE_KEY = "gejv17_large_font";
const LARGE_FONT_CLASS = "large-font";

export default function FontSizeToggle() {
  const [isLarge, setIsLarge] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) === "1";
  });

  useEffect(() => {
    if (isLarge) {
      document.documentElement.classList.add(LARGE_FONT_CLASS);
      localStorage.setItem(STORAGE_KEY, "1");
    } else {
      document.documentElement.classList.remove(LARGE_FONT_CLASS);
      localStorage.setItem(STORAGE_KEY, "0");
    }
  }, [isLarge]);

  // Apply on mount (for page reload persistence)
  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === "1") {
      document.documentElement.classList.add(LARGE_FONT_CLASS);
      setIsLarge(true);
    }
  }, []);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={() => setIsLarge((v) => !v)}
          variant="outline"
          size="icon"
          className={`
            fixed bottom-6 right-6 z-50 w-11 h-11 rounded-full shadow-lg
            border-primary/40 bg-background/90 backdrop-blur-sm
            hover:bg-primary/10 hover:border-primary transition-all duration-200
            ${isLarge ? "border-primary bg-primary/15 text-primary" : "text-muted-foreground"}
          `}
          aria-label={isLarge ? "縮小字體" : "放大字體"}
        >
          {isLarge ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="left">
        {isLarge ? "恢復正常字體大小" : "輔助閱讀：放大字體兩倍"}
      </TooltipContent>
    </Tooltip>
  );
}
