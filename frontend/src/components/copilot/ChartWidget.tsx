import React, { useState } from 'react';
import { ChartSpec } from '../../types/ram';
import { BarChart3, TrendingUp, PieChart as PieIcon } from 'lucide-react';

interface ChartWidgetProps {
  spec: ChartSpec;
}

export const ChartWidget: React.FC<ChartWidgetProps> = ({ spec }) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const data = spec.data || [];
  if (data.length === 0) return null;

  const xKey = spec.xKey || Object.keys(data[0])[0];
  const yKeys = spec.yKeys || [Object.keys(data[0])[1]];
  const primaryYKey = yKeys[0];

  const values = data.map((d) => Number(d[primaryYKey]) || 0);
  const maxValue = Math.max(...values, 1);

  return (
    <div className="my-3 bg-[#070e1b] border border-cyan-800/60 rounded-xl p-4 shadow-lg flex flex-col gap-3">
      <div className="flex items-center justify-between border-b border-[#1e293b] pb-2.5">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" />
          <h4 className="font-headline text-xs font-bold text-slate-100">
            {spec.title || 'Tool-Generated Visual Analytics'}
          </h4>
        </div>
        <span className="text-[10px] font-mono text-primary bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
          render_chart
        </span>
      </div>

      {/* SVG Bar Chart */}
      <div className="relative pt-2">
        <div className="flex items-end gap-3 h-44 px-2">
          {data.map((item, idx) => {
            const val = Number(item[primaryYKey]) || 0;
            const heightPercent = Math.round((val / maxValue) * 100);
            const label = String(item[xKey] || `Item ${idx + 1}`);
            const isHovered = hoverIndex === idx;

            return (
              <div
                key={idx}
                onMouseEnter={() => setHoverIndex(idx)}
                onMouseLeave={() => setHoverIndex(null)}
                className="flex-1 flex flex-col items-center justify-end h-full gap-1.5 group cursor-pointer"
              >
                {/* Tooltip on hover */}
                {isHovered && (
                  <div className="absolute -top-1 bg-[#1e293b] text-cyan-300 font-mono text-[10px] px-2 py-1 rounded shadow-lg border border-cyan-700 pointer-events-none z-10 whitespace-nowrap">
                    {label}: <strong>{val}</strong>
                  </div>
                )}

                <div
                  className={`w-full rounded-t transition-all duration-300 ${
                    isHovered
                      ? 'bg-cyan-400 shadow-lg shadow-cyan-500/50'
                      : 'bg-primary/80 hover:bg-primary'
                  }`}
                  style={{ height: `${Math.max(8, heightPercent)}%` }}
                />

                <span className="text-[10px] font-mono text-slate-400 truncate max-w-[50px] text-center">
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-[#1e293b]">
        <span>Metric: <strong className="text-slate-300">{primaryYKey}</strong></span>
        <span>Interactive Telemetry Projection</span>
      </div>
    </div>
  );
};
