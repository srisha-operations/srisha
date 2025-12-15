import React from "react";

interface StepperProps {
  steps: string[];
  currentIndex: number; // 1-based index for compatibility with OrderStageMap
  className?: string;
}

export const Stepper: React.FC<StepperProps> = ({ steps, currentIndex, className }) => {
  const progress = Math.max(0, Math.min(100, ((currentIndex - 1) / Math.max(1, (steps.length - 1))) * 100));
  return (
    <div className={"w-full " + (className || "")}> 
      {/* Mobile: vertical, Desktop: horizontal */}
      <div className="md:hidden flex gap-4">
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute top-0 left-3 h-full w-[2px] bg-muted rounded" />
          <ol aria-label="Order progress" className="flex flex-col gap-6 z-10">
            {steps.map((label, idx) => {
              const i = idx + 1;
              const active = i <= currentIndex;
              const isCurrent = i === currentIndex;
              return (
                <li key={`vstep-${idx}`} aria-current={i === currentIndex ? 'step' : undefined} className="flex items-center gap-4">
                  <div className="flex items-center justify-center">
                    <div className={`w-6 h-6 rounded-full border ${active && !isCurrent ? "border-primary bg-primary" : isCurrent ? "border-primary bg-white" : "border-muted bg-white"}`} />
                  </div>
                  <span className={`text-sm ${active ? "text-foreground font-semibold" : "text-muted-foreground"}`}>{label}</span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      {/* Desktop horizontal */}
      <div className="hidden md:block">
        <div className="relative h-12">
          <div className="absolute inset-0 flex items-center justify-between px-4 md:px-0">
            <div className="w-full h-1 bg-muted rounded" style={{ top: 'calc(50% - 0.5px)', position: 'absolute' }} />
            {/* progress overlay */}
            <div className="absolute left-0 h-1 bg-primary rounded" style={{ width: `${progress}%`, top: 'calc(50% - 0.5px)' }} />
            {/* Progress is handled by step indicator dots */}
          </div>
          <ol aria-label="Order progress" className="flex items-center gap-4 relative z-10 w-full">
            {steps.map((label, idx) => {
              const i = idx + 1;
              const active = i <= currentIndex;
              const isCurrent = i === currentIndex;
              return (
                <li key={`hstep-${idx}`} aria-current={isCurrent ? 'step' : undefined} className="flex-1 flex flex-col items-center text-center">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${active && !isCurrent ? "bg-primary text-white" : isCurrent ? "bg-white border border-primary text-primary" : "bg-white border border-muted text-muted-foreground"}`}>
                    <div className="text-xs font-medium">{i}</div>
                  </div>
                  <span className={`mt-2 text-xs ${isCurrent ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{label}</span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
};

export default Stepper;
