import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { TrendingUp, Activity, Calendar } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-[#EAEAEA] rounded-xl p-3 shadow-xl text-xs">
        <p className="font-bold text-[#171717] mb-1.5 flex items-center gap-1.5">
          <Calendar size={12} className="text-[#F5C400]" />
          <span>{label}</span>
        </p>
        <div className="space-y-1 font-mono">
          <div className="flex items-center justify-between gap-4">
            <span className="text-[#777777] flex items-center gap-1 font-sans">
              <span className="w-2 h-2 rounded-full bg-[#F5C400]" />
              Progress:
            </span>
            <span className="font-bold text-[#171717]">
              {payload[0].value}%
            </span>
          </div>
          {payload[1] && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-[#777777] flex items-center gap-1 font-sans">
                <span className="w-2 h-2 rounded-full bg-[#F28C28]" />
                Target Milestone:
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

export default function ProjectProgressTrend({ data = [] }) {
  const [showTarget, setShowTarget] = useState(true);

  return (
    <div className="bg-white rounded-2xl p-6 border border-[#EAEAEA] shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EAEAEA]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-bold text-[#171717] tracking-tight">
              Progress Velocity Trend Across Runs
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F7F7F5] text-[#777777] border border-[#EAEAEA]">
              Recharts LineChart
            </span>
          </div>
          <p className="text-xs text-[#777777] mt-0.5">
            Sequential feature fulfillment trajectory mapped over past inspection cycles
          </p>
        </div>

        {/* Legend / Toggles */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowTarget(!showTarget)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
              showTarget
                ? 'bg-[#F7F7F5] text-[#171717] border-[#EAEAEA]'
                : 'bg-white text-[#777777] border-[#EAEAEA]'
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
      {data.length > 0 ? (
        <div className="w-full h-64 sm:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 10, right: 15, left: -20, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#EAEAEA"
                vertical={false}
              />

              <XAxis
                dataKey="run"
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

              {/* Target Trajectory Line */}
              {showTarget && (
                <Line
                  type="monotone"
                  dataKey="target"
                  stroke="#F28C28"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 4, fill: '#F28C28' }}
                />
              )}

              {/* Actual Progress Line */}
              <Line
                type="monotone"
                dataKey="progress"
                stroke="#F5C400"
                strokeWidth={3}
                activeDot={{
                  r: 7,
                  fill: '#F5C400',
                  stroke: '#171717',
                  strokeWidth: 2,
                }}
                dot={{ r: 5, fill: '#F5C400', stroke: '#171717', strokeWidth: 1.5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="p-8 text-center bg-[#F7F7F5] rounded-xl border border-dashed border-[#EAEAEA] space-y-2">
          <TrendingUp size={24} className="text-[#777777] mx-auto" />
          <h4 className="text-xs font-semibold text-[#171717]">Velocity Trend Pending Additional Runs</h4>
          <p className="text-[11px] text-[#777777] max-w-md mx-auto">
            Progress velocity curves require at least one completed AST analysis cycle to project sprint velocity.
          </p>
        </div>
      )}

      {/* Bottom Info Banner */}
      <div className="pt-3 border-t border-[#EAEAEA] flex items-center justify-between text-xs text-[#777777]">
        <span className="flex items-center gap-1.5">
          <TrendingUp size={13} className="text-emerald-600" />
          <span>Consistent upward velocity across successive codebase commits</span>
        </span>
        <span className="text-[11px] text-[#777777] font-mono">
          Interpolated with cubic spline smoothing
        </span>
      </div>
    </div>
  );
}
