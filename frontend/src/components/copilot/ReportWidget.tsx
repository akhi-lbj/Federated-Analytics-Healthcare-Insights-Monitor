import React from 'react';
import { ReportSpec } from '../../types/ram';
import { LineChart, ExternalLink, Image as ImageIcon } from 'lucide-react';

interface ReportWidgetProps {
  spec: ReportSpec;
}

export const ReportWidget: React.FC<ReportWidgetProps> = ({ spec }) => {
  return (
    <div className="my-3 bg-[#070e1b] border border-cyan-800/60 rounded-xl overflow-hidden shadow-lg flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-[#1e293b] bg-[#0b1326]">
        <div className="flex items-center gap-2">
          <LineChart className="w-4 h-4 text-primary" />
          <h4 className="font-headline text-xs font-bold text-slate-100">
            {spec.title || 'SAS Visual Analytics Report'}
          </h4>
        </div>
        <span className="text-[10px] font-mono text-primary bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
          render_report
        </span>
      </div>

      {spec.imageUrl ? (
        <div className="relative group overflow-hidden bg-black/40 max-h-56 flex items-center justify-center">
          <img
            src={spec.imageUrl}
            alt={spec.title || 'Report Visual'}
            className="w-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      ) : (
        <div className="p-8 flex flex-col items-center justify-center gap-2 text-slate-500 bg-[#070e1b]">
          <ImageIcon className="w-8 h-8 text-cyan-800" />
          <span className="text-xs">Live SAS Visual Analytics Snapshot</span>
        </div>
      )}

      {spec.viewerUrl && (
        <div className="p-3 bg-[#0f172a] border-t border-[#1e293b] flex items-center justify-between">
          <span className="text-[10px] text-slate-400 font-mono">Report ID: {spec.reportId || 'SAS-VA-REP-01'}</span>
          <a
            href={spec.viewerUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-cyan-300 transition-colors"
          >
            <span>Open in SAS Visual Analytics</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}
    </div>
  );
};
