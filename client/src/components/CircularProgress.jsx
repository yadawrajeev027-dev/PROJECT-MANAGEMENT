import React from 'react';

/**
 * Reusable Circular Progress Indicator
 * SVG-based, resolution-independent with clean warm accent stroke
 */
export default function CircularProgress({ 
  percentage = 74, 
  size = 120, 
  strokeWidth = 10,
  gradientId = 'circleGradient',
  startColor = '#F5C400',
  endColor = '#F28C28',
  subtitle = 'Completed'
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={startColor} />
            <stop offset="100%" stopColor={endColor} />
          </linearGradient>
        </defs>

        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#EAEAEA"
          strokeWidth={strokeWidth}
          className="fill-none"
        />

        {/* Progress stroke */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="fill-none transition-all duration-1000 ease-out"
        />
      </svg>

      {/* Center Label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-2xl font-bold tracking-tight text-[#171717]">
          {percentage}<span className="text-sm font-semibold text-[#F5C400]">%</span>
        </span>
        {subtitle && (
          <span className="text-[10px] font-semibold tracking-wider uppercase text-[#777777]">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
