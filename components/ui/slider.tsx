"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SliderProps {
  value: number[]
  onValueChange: (value: number[]) => void
  max: number
  min: number
  step: number
  className?: string
}

const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
  ({ className, value, onValueChange, max, min, step, ...props }, ref) => {
    const [minVal, maxVal] = value

    const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newMin = Math.min(Number(e.target.value), maxVal - step)
      onValueChange([newMin, maxVal])
    }

    const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newMax = Math.max(Number(e.target.value), minVal + step)
      onValueChange([minVal, newMax])
    }

    return (
      <div ref={ref} className={cn("relative flex w-full touch-none select-none items-center", className)} {...props}>
        <div className="relative w-full">
          {/* Track background */}
          <div className="h-2 w-full bg-gray-200 rounded-full relative">
            {/* Active range */}
            <div
              className="absolute h-full bg-red-500 rounded-full"
              style={{
                left: `${((minVal - min) / (max - min)) * 100}%`,
                width: `${((maxVal - minVal) / (max - min)) * 100}%`,
              }}
            />
          </div>

          {/* Min range input */}
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={minVal}
            onChange={handleMinChange}
            className="absolute top-0 w-full h-2 bg-transparent appearance-none pointer-events-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-red-500 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:cursor-pointer"
          />

          {/* Max range input */}
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={maxVal}
            onChange={handleMaxChange}
            className="absolute top-0 w-full h-2 bg-transparent appearance-none pointer-events-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-red-500 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:cursor-pointer"
          />
        </div>
      </div>
    )
  },
)

Slider.displayName = "Slider"

export { Slider }
