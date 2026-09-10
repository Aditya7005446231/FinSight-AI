import React, { useState } from 'react';

/**
 * AdaptiveSlider component for range inputs with custom styling,
 * smooth track progress, glowing thumb, and hover tooltips.
 */
export const AdaptiveSlider = ({
  min = 0,
  max = 100,
  step = 1,
  value,
  defaultValue,
  onChange,
  onValueChange,
  className = '',
  disabled = false,
  ...props
}) => {
  const [internalVal, setInternalVal] = useState(
    defaultValue !== undefined ? defaultValue : min
  );
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const currentVal = value !== undefined ? value : internalVal;

  // Calculate track fill percentage
  const minNum = Number(min);
  const maxNum = Number(max);
  const range = maxNum - minNum || 1;
  const percentage = Math.min(
    100,
    Math.max(0, ((Number(currentVal) - minNum) / range) * 100)
  );

  const handleChange = (e) => {
    const newVal = Number(e.target.value);
    if (value === undefined) {
      setInternalVal(newVal);
    }
    if (onValueChange) {
      onValueChange(newVal);
    }
    if (onChange) {
      onChange(e);
    }
  };

  return (
    <div
      className={`relative flex items-center w-full py-2 select-none group ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsDragging(false);
      }}
    >
      {/* Background Track */}
      <div className="relative w-full h-2 rounded-full bg-neutral-800/90 border border-neutral-700/60 overflow-hidden shadow-inner">
        {/* Active Track Progress */}
        <div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-500 rounded-full transition-all duration-75 ease-out shadow-[0_0_12px_rgba(99,102,241,0.5)]"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Custom Animated Thumb */}
      <div
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none transition-transform duration-75 ease-out"
        style={{ left: `${percentage}%` }}
      >
        <div
          className={`w-5 h-5 rounded-full bg-white border-2 border-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.7)] flex items-center justify-center transition-all duration-150 ${
            isDragging || isHovered
              ? 'scale-125 border-indigo-400 shadow-[0_0_16px_rgba(129,140,248,0.9)]'
              : 'scale-100'
          }`}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
        </div>

        {/* Floating Value Tooltip on drag/hover */}
        <div
          className={`absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-neutral-900 border border-neutral-700 text-[11px] font-semibold text-indigo-300 shadow-md pointer-events-none transition-opacity duration-150 ${
            isHovered || isDragging ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
          }`}
        >
          {currentVal}
        </div>
      </div>

      {/* Accessible native input range overlay */}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={currentVal}
        disabled={disabled}
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        onTouchStart={() => setIsDragging(true)}
        onTouchEnd={() => setIsDragging(false)}
        onChange={handleChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
        {...props}
      />
    </div>
  );
};

export default AdaptiveSlider;
