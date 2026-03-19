import * as React from "react"
import { cn } from "@/lib/utils"

interface SliderProps {
  value?: number[];
  onValueChange?: (value: number[]) => void;
  max?: number;
  step?: number;
  className?: string;
}

const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
  ({ className, value = [0], onValueChange, max = 100, step = 1, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = parseInt(e.target.value);
      onValueChange?.([newValue]);
    };

    return (
      <div ref={ref} className={cn("relative flex w-full items-center", className)} {...props}>
        <div className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
          <div 
            className="absolute h-full bg-primary"
            style={{ width: `${(value[0] / max) * 100}%` }}
          />
        </div>
        <input
          type="range"
          min={0}
          max={max}
          step={step}
          value={value[0]}
          onChange={handleChange}
          className="absolute w-full h-full opacity-0 cursor-pointer"
        />
      </div>
    );
  }
)
Slider.displayName = "Slider"

export { Slider }
