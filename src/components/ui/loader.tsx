import React from "react";
import { cn } from "@/lib/utils";

interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  fullScreen?: boolean;
}

export function Loader({ className, fullScreen = false, ...props }: LoaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-50",
        fullScreen ? "fixed inset-0 w-full h-full" : "w-full h-full min-h-[40vh]",
        className
      )}
      {...props}
    >
      <div className="relative flex flex-col items-center">
        {/* Brand Text Pulse */}
        <h1 className="font-tenor text-3xl md:text-4xl tracking-widest animate-pulse duration-1000">
          SRISHA
        </h1>
        {/* Subtle separator using brand aesthetic */}
        <div className="w-12 h-[1px] bg-foreground/30 mt-4 mb-4" />
        {/* Minimal spinner */}
        <div className="w-5 h-5 border-[1px] border-foreground/20 border-t-foreground rounded-full animate-spin" />
      </div>
    </div>
  );
}
