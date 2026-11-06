import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { TrendingUp, Calendar, Info } from 'lucide-react';

// Custom clean SaaS themed tooltip
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-[#EAEAEA] rounded-xl p-3 shadow-xl text-xs">
        <p className="font-bold text-[#171717] mb-1.5 flex items-center gap-1.5">
          <Calendar size={12} className="text-[#F5C400]" />
          <span>{label} Milestone</span>
        </p>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-4">
            <span className="text-[#777777] flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#F5C400]" />
              Completion:
            </span>
            <span className="font-bold text-[#171717]">
              {payload[0].value}%
            </span>
          </div>
          {payload[1] && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-[#777777] flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#F28C28]" />
                Target:
              </span>
              <span className="font-semibold text-[#171717]">
                {payload[1].value}%
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export default function ProgressChart({ data }) {
  const [showTarget, setShowTarget] = useState(true);

  return (
    <div className="bg-white rounded-2xl p-6 border border-[#EAEAEA] shadow-sm flex flex-col justify-between">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-bold text-[#171717] tracking-tight">
              Weekly Progress Velocity
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#F7F7F5] text-[#777777] border border-[#EAEAEA]">
              Recharts
            </span>
          </div>
          <p className="text-xs text-[#777777] mt-0.5">
            Progressive feature completion rate tracked across last 7 days
          </p>
        </div>

        {/* Chart Legend / Toggle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowTarget(!showTarget)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
              showTarget
                ? 'bg-[#F7F7F5] text-[#171717] border-[#EAEAEA]'
                : 'bg-white text-[#777777] border-[#EAEAEA] hover:text-[#171717]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#F28C28]" />
            <span>Target Line</span>
          </button>

          <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[#F5C400]/15 text-[#171717] border border-[#F5C400]/40 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#F5C400]" />
            <span>Actual %</span>
          </span>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="w-full h-64 sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              {/* Completion Area Gradient */}
              <linearGradient id="completionGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F5C400" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#F5C400" stopOpacity={0.0} />
              </linearGradient>

              {/* Target Area Gradient */}
              <linearGradient id="targetGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F28C28" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#F28C28" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#EAEAEA" 
              vertical={false} 
            />

            <XAxis
              dataKey="day"
              stroke="#777777"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#EAEAEA' }}
            />

            <YAxis
              stroke="#777777"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#EAEAEA' }}
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Target Area (Optional) */}
            {showTarget && (
              <Area
                type="monotone"
                dataKey="target"
                stroke="#F28C28"
                strokeWidth={2}
                strokeDasharray="4 4"
                fillOpacity={1}
                fill="url(#targetGradient)"
              />
            )}

            {/* Actual Completion Area */}
            <Area
              type="monotone"
              dataKey="completion"
              stroke="#F5C400"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#completionGradient)"
              activeDot={{
                r: 6,
                fill: '#F5C400',
                stroke: '#171717',
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Footer Info */}
      <div className="mt-4 pt-3 border-t border-[#EAEAEA] flex items-center justify-between text-xs text-[#777777]">
        <span className="flex items-center gap-1.5">
          <TrendingUp size={13} className="text-emerald-600" />
          <span>Velocity: <strong className="text-[#171717]">+32%</strong> over prior sprint</span>
        </span>
        <span className="text-[11px] text-[#777777]">
          Updated automatically with commit checkpoints
        </span>
      </div>
    </div>
  );
}
