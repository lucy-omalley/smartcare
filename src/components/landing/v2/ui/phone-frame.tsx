import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function PhoneFrame({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <figure className={cn("flex flex-col items-center gap-3", className)}>
      <div className="relative w-[220px] sm:w-[240px]">
        <div className="rounded-[2rem] border-[6px] border-foreground/10 bg-foreground/5 p-1.5 shadow-xl shadow-foreground/5">
          <div className="rounded-[1.4rem] overflow-hidden bg-background aspect-[9/19.5] relative">
            <div className="absolute top-0 inset-x-0 h-6 bg-background/90 z-10 flex items-center justify-center">
              <div className="w-16 h-1 rounded-full bg-foreground/10" />
            </div>
            {children}
          </div>
        </div>
      </div>
      <figcaption className="text-sm font-medium text-muted-foreground">{title}</figcaption>
    </figure>
  );
}
