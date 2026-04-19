import { Play } from "lucide-react";

export function DashboardPreview() {
  return (
    <div className="relative rounded-2xl border border-border bg-card shadow-[var(--shadow-elevated)] overflow-hidden">
      <div className="aspect-video w-full bg-muted flex flex-col items-center justify-center gap-3 text-muted-foreground">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-background/80 border border-border shadow-sm">
          <Play className="h-6 w-6 ml-0.5" strokeWidth={1.6} />
        </span>
        <p className="text-xs sm:text-sm tracking-wide">
          Vídeo de apresentação em breve
        </p>
      </div>
    </div>
  );
}
