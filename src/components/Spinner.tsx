import React from "react";

type SpinnerProps = {
  size?: number; // px
  colorClass?: string; // Tailwind color class for stroke
  speedClass?: string; // Tailwind animation speed (custom if needed)
  label?: string; // a11y label
};

export const Spinner: React.FC<SpinnerProps> = ({
  size = 48,
  colorClass = "text-indigo-500",
  speedClass = "animate-spin",
  label = "Loading…",
}) => {
  const r = size / 2 - 4; // radius for stroke (4px padding for stroke width)

  return (
    <span
      role="status"
      aria-label={label}
      className="inline-flex items-center justify-center"
    >
      <svg
        className={`${speedClass}`}
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        fill="none"
      >
        {/* Background ring */}
        <circle
          className="text-gray-200"
          stroke="currentColor"
          strokeWidth="4"
          cx={size / 2}
          cy={size / 2}
          r={r}
        />
        {/* Animated arc */}
        <path
          className={colorClass}
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="4"
          d={`M ${size / 2} ${size / 2 - r} 
             a ${r} ${r} 0 0 1 0 ${2 * r}`}
        />
      </svg>
    </span>
  );
};
