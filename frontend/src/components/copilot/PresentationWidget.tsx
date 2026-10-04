import React, { useState } from 'react';
import { PresentationSpec } from '../../types/ram';
import { 
  FileText, 
  Download, 
  ExternalLink, 
  Layers, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  Sliders,
  Tv
} from 'lucide-react';

interface PresentationWidgetProps {
  spec: PresentationSpec;
  onRefreshStatus?: (taskId: string) => void;
}

export const PresentationWidget: React.FC<PresentationWidgetProps> = ({ spec, onRefreshStatus }) => {
  const [isChecking, setIsChecking] = useState(false);

  const isCompleted = Boolean(spec.downloadUrl || spec.editUrl || spec.status === 'completed' || spec.status === 'success');
  const isPending = !isCompleted && (spec.status === 'pending' || spec.status === 'running');
  const isError = !isCompleted && !isPending && (spec.status === 'error' || spec.status === 'failed');

  const handleCheck = () => {
    if (spec.taskId && onRefreshStatus) {
      setIsChecking(true);
      onRefreshStatus(spec.taskId);
      setTimeout(() => setIsChecking(false), 2000);
    }
  };

  return (
    <div className="my-4 bg-gradient-to-br from-[#0c162d] to-[#070e1b] border border-amber-500/40 rounded-2xl p-5 shadow-2xl flex flex-col gap-4 relative overflow-hidden">
      {/* Decorative ambient glow */}
      <div className="absolute top-0 right-0 w-64 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-[#1e293b] pb-3 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 shadow-md">
            <Tv className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-headline text-sm font-bold text-slate-100">
                {spec.title || 'PowerPoint Presentation Deck'}
              </h4>
              <span className="text-[10px] font-mono text-amber-300 font-bold bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800">
                PPTX AI
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              AI Presentation Generator (Presenton Service)
            </span>
          </div>
        </div>

        {/* Status Chip */}
        <div>
          {isCompleted ? (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700 text-emerald-300 text-xs font-bold shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Generated Successfully</span>
            </span>
          ) : isPending ? (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-700 text-amber-300 text-xs font-bold animate-pulse shadow-xs">
              <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              <span>Generating Slides...</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-700 text-amber-300 text-xs font-bold">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Processing in Background</span>
            </span>
          )}
        </div>
      </div>

      {/* Presentation Metadata Specs Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs z-10">
        <div className="bg-[#0b1326] p-2.5 rounded-xl border border-[#1e293b]">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Template Style</span>
          <span className="font-mono font-bold text-cyan-300 capitalize">{spec.template || 'Pulse (Clinical)'}</span>
        </div>
        <div className="bg-[#0b1326] p-2.5 rounded-xl border border-[#1e293b]">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Slide Count</span>
          <span className="font-mono font-bold text-slate-200">{spec.nSlides || 6} Slides</span>
        </div>
        <div className="bg-[#0b1326] p-2.5 rounded-xl border border-[#1e293b]">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Format</span>
          <span className="font-mono font-bold text-amber-300">Microsoft PowerPoint (.pptx)</span>
        </div>
        <div className="bg-[#0b1326] p-2.5 rounded-xl border border-[#1e293b]">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Task Reference</span>
          <span className="font-mono font-bold text-slate-300 truncate block text-[10px]" title={spec.presentationId || spec.taskId}>
            {spec.presentationId ? `ID: ${spec.presentationId.slice(0, 12)}...` : spec.taskId ? `${spec.taskId.slice(0, 12)}...` : 'Complete'}
          </span>
        </div>
      </div>

      {/* Live Progress or Status Message */}
      {isCompleted ? (
        <div className="bg-[#070e1b] border border-emerald-800/60 rounded-xl p-3 flex items-center justify-between text-xs z-10">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-200">
              Status: <strong className="text-emerald-300 font-headline">Deck Generation Complete &amp; Intake Ready</strong>
            </span>
          </div>
          {spec.presentationId && (
            <span className="text-[10px] font-mono text-emerald-400/80 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
              ID: {spec.presentationId.slice(0, 8)}...
            </span>
          )}
        </div>
      ) : spec.message ? (
        <div className="bg-[#070e1b] border border-[#1e293b] rounded-xl p-3 flex items-center justify-between text-xs z-10">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span className="text-slate-300">
              Current Step: <strong className="text-amber-200 font-headline">{spec.message}</strong>
            </span>
          </div>
          {spec.taskId && onRefreshStatus && (
            <button
              onClick={handleCheck}
              disabled={isChecking}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#0f172a] hover:bg-[#1e293b] text-cyan-300 border border-cyan-800 text-[11px] font-semibold transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isChecking ? 'animate-spin' : ''}`} />
              <span>Refresh Status</span>
            </button>
          )}
        </div>
      ) : null}

      {/* Content Outline Preview if available */}
      {spec.contentSummary && (
        <div className="bg-[#070e1b] border border-[#1e293b] rounded-xl p-3 text-xs z-10">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
            Deck Structure &amp; Data Payload
          </span>
          <p className="text-slate-300 text-xs font-mono line-clamp-3">
            {spec.contentSummary}
          </p>
        </div>
      )}

      {/* Action CTA Buttons */}
      <div className="flex items-center justify-between pt-2 border-t border-[#1e293b] z-10">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Professional deck styled for hospital leadership &amp; command review</span>
        </div>

        <div className="flex items-center gap-2">
          {spec.downloadUrl && (
            <a
              href={spec.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#060e20] text-xs font-black transition-all shadow-lg shadow-amber-500/20 active:scale-[0.98]"
            >
              <Download className="w-4 h-4" />
              <span>Download PPTX (.pptx)</span>
            </a>
          )}

          {spec.editUrl && (
            <a
              href={spec.editUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0f172a] hover:bg-[#1e293b] border border-cyan-800 text-cyan-300 text-xs font-bold transition-all shadow-md"
            >
              <ExternalLink className="w-4 h-4 text-primary" />
              <span>Edit in Presenton</span>
            </a>
          )}

          {!spec.downloadUrl && !spec.editUrl && (
            <div className="text-[11px] text-slate-400 font-mono italic">
              Slide generation dispatched · Processing layout in background
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
