import React, { useState } from 'react';
import { ToolCall } from '../../types/ram';
import { ChevronDown, ChevronRight, Wrench, Eye, CheckCircle2, AlertCircle } from 'lucide-react';

interface ToolCallTraceProps {
  toolCalls: ToolCall[];
  onOpenInspector: () => void;
}

export const ToolCallTrace: React.FC<ToolCallTraceProps> = ({ toolCalls, onOpenInspector }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!toolCalls || toolCalls.length === 0) return null;

  return (
    <div className="mt-2.5 bg-[#070e1b] border border-[#1e293b] rounded-lg overflow-hidden text-xs">
      {/* Collapsible Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between px-3 py-2 bg-[#0b1326] hover:bg-[#131b2e] cursor-pointer transition-colors"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-primary" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          )}
          <span className="font-semibold text-slate-300">
            Agent tool calls · {toolCalls.length} step{toolCalls.length > 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenInspector();
            }}
            className="flex items-center gap-1 text-[10px] text-primary hover:text-cyan-300 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800 transition-colors"
            title="Open Deep Observability Audit Inspector"
          >
            <Eye className="w-3 h-3" />
            <span>Audit Details</span>
          </button>
        </div>
      </div>

      {/* Expanded Step Cards */}
      {isExpanded && (
        <div className="p-2.5 flex flex-col gap-2 border-t border-[#1e293b]">
          {toolCalls.map((call, idx) => {
            const isErr = call.output?.isError;
            const inputStr = JSON.stringify(call.input || {});
            const outputStr = typeof call.output === 'object'
              ? JSON.stringify(call.output?.structuredContent || call.output?.content || call.output)
              : String(call.output || '');

            return (
              <div
                key={call.id || idx}
                className="bg-[#0f172a] border border-[#1e293b] p-2.5 rounded-md flex flex-col gap-1.5 font-mono text-[11px]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-cyan-950 text-primary border border-cyan-800 flex items-center justify-center text-[10px] font-bold font-sans">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-cyan-300 flex items-center gap-1">
                      <Wrench className="w-3 h-3 text-primary" />
                      {call.toolName}
                    </span>
                  </div>

                  <span className="text-[10px] font-sans">
                    {isErr ? (
                      <span className="text-rose-400 flex items-center gap-0.5">
                        <AlertCircle className="w-3 h-3" /> Failed
                      </span>
                    ) : (
                      <span className="text-emerald-400 flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3" /> Succeeded
                      </span>
                    )}
                  </span>
                </div>

                {/* Input snippet */}
                <div className="text-slate-400 truncate max-w-full">
                  <span className="text-slate-500 font-semibold">in: </span>
                  <span className="text-slate-300">{inputStr.slice(0, 180)}{inputStr.length > 180 ? '...' : ''}</span>
                </div>

                {/* Output snippet */}
                <div className="text-slate-400 truncate max-w-full">
                  <span className="text-slate-500 font-semibold">out: </span>
                  <span className="text-emerald-300/90">{outputStr.slice(0, 220)}{outputStr.length > 220 ? '...' : ''}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
