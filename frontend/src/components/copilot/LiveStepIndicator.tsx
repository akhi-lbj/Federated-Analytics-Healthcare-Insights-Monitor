import React, { useState, useEffect } from 'react';
import { TraceAggregate } from '../../types/ram';
import { Wrench, BookOpen, Sparkles, Loader2, Bot, Activity } from 'lucide-react';

interface LiveStepIndicatorProps {
  trace?: TraceAggregate | null;
  pollTick: number;
}

export const LiveStepIndicator: React.FC<LiveStepIndicatorProps> = ({ trace, pollTick }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const toolCalls = trace?.toolCalls || [];
  const retrievalCalls = trace?.retrievalCalls || [];
  const llmCalls = trace?.llmCalls || [];
  const totalSteps = toolCalls.length + retrievalCalls.length + llmCalls.length;

  // Dynamic context-aware status feedback
  const getStatusMessage = () => {
    if (llmCalls.length > 0) {
      return 'Agent FAHIM is synthesizing response, formatting tables & clinical metrics...';
    }
    if (toolCalls.length > 0) {
      const latestTool = toolCalls[toolCalls.length - 1]?.toolName || 'tool';
      return `Agent is actively executing clinical tool: ${latestTool}...`;
    }
    if (retrievalCalls.length > 0) {
      return 'Agent is querying SAS Retrieval Agent Manager knowledge vectors...';
    }
    if (elapsed < 3) {
      return 'Agent FAHIM received query — analyzing request & planning reasoning path...';
    }
    if (elapsed < 6) {
      return 'Connecting to SAS RAM Engine & evaluating hospital database schema...';
    }
    return 'Agent is working on clinical reasoning and fetching live telemetry...';
  };

  return (
    <div className="flex items-start gap-4 my-3 max-w-4xl animate-fadeIn">
      {/* Agent Bot Avatar */}
      <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-700/80 flex items-center justify-center text-primary shadow-lg flex-shrink-0 mt-0.5">
        <Bot className="w-5 h-5 text-primary animate-pulse" />
      </div>

      {/* Main Mid-Flight Agent Working Bubble */}
      <div className="flex-1 bg-[#0b1326] border border-cyan-800/80 rounded-2xl p-4 shadow-2xl flex flex-col gap-3 relative overflow-hidden">
        {/* Glowing top line */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" />

        {/* Header Bar */}
        <div className="flex items-center justify-between text-xs border-b border-[#1e293b]/70 pb-2.5">
          <div className="flex items-center gap-2.5">
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
            <div className="flex items-center gap-2">
              <span className="font-headline font-bold text-slate-100 text-[13px]">
                Agent FAHIM is working...
              </span>
              <span className="px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-700/80 text-[10px] font-mono font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                Thinking
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className="text-slate-400">
              {elapsed}s elapsed
            </span>
            <span className="text-cyan-300 font-bold bg-[#070e1b] px-2 py-0.5 rounded border border-[#1e293b]">
              {totalSteps > 0 ? `${totalSteps} step${totalSteps > 1 ? 's' : ''}` : `Tick ${pollTick || 1}`}
            </span>
          </div>
        </div>

        {/* Dynamic Contextual Text Feedback */}
        <div className="flex items-center gap-2.5 py-0.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping flex-shrink-0" />
          <p className="text-xs text-slate-200 font-medium italic">
            {getStatusMessage()}
          </p>
        </div>

        {/* Live Mid-Flight Tool Pills (Preserved & Enhanced) */}
        {totalSteps > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#1e293b]/60">
            {toolCalls.map((tc, idx) => (
              <span
                key={tc.id || idx}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0f172a] text-cyan-300 border border-cyan-700/80 text-[11px] font-mono font-semibold shadow-xs"
              >
                <Wrench className="w-3.5 h-3.5 text-primary" />
                <span>{tc.toolName}</span>
                <span className="text-emerald-400 font-bold">✓</span>
              </span>
            ))}

            {retrievalCalls.map((rc, idx) => (
              <span
                key={rc.id || idx}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0f172a] text-teal-300 border border-teal-700/80 text-[11px] font-mono font-semibold shadow-xs"
              >
                <BookOpen className="w-3.5 h-3.5 text-secondary" />
                <span>RAG Retrieval</span>
                <span className="text-emerald-400 font-bold">✓</span>
              </span>
            ))}

            {llmCalls.map((lc, idx) => (
              <span
                key={lc.id || idx}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0f172a] text-purple-300 border border-purple-700/80 text-[11px] font-mono font-semibold shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Synthesis</span>
                <span className="text-emerald-400 font-bold">✓</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
