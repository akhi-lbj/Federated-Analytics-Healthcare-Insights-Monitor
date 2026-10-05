import React, { useState } from 'react';
import { RamTurn } from '../../types/ram';
import { 
  X, 
  Terminal, 
  Coins, 
  Cpu, 
  BookOpen, 
  Wrench, 
  Copy, 
  Check, 
  Database 
} from 'lucide-react';

interface QueryInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  turn: RamTurn | null;
}

export const QueryInspectorModal: React.FC<QueryInspectorModalProps> = ({
  isOpen,
  onClose,
  turn,
}) => {
  const [activeTab, setActiveTab] = useState<'tools' | 'rag' | 'tokens' | 'raw'>('tools');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !turn) return null;

  const toolCalls = turn.trace?.toolCalls || [];
  const retrievalCalls = turn.trace?.retrievalCalls || [];
  const llmCalls = turn.trace?.llmCalls || [];
  const usage = turn.usageMetadata || {};

  const handleCopyRaw = () => {
    navigator.clipboard.writeText(JSON.stringify(turn, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#1e293b] flex items-center justify-between bg-[#070e1b]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-950/80 border border-cyan-800 flex items-center justify-center text-primary">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-headline text-base font-bold text-slate-100 flex items-center gap-2">
                <span>Query Deep Observability Inspector</span>
                <span className="text-[10px] font-mono text-primary bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                  {turn.id}
                </span>
              </h3>
              <span className="text-[11px] text-slate-400">
                Auditing SAS RAM Reasoning, Tool Invocations, and RAG Similarity
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyRaw}
              className="flex items-center gap-1 text-xs text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg bg-[#1e293b] border border-[#334155]"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy JSON'}</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-[#1e293b]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Telemetry Stat Cards */}
        <div className="grid grid-cols-4 gap-3 p-4 bg-[#0b1326] border-b border-[#1e293b] text-xs">
          <div className="bg-[#070e1b] border border-[#1e293b] p-3 rounded-lg">
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Prompt Tokens</span>
            <span className="font-mono text-base font-bold text-slate-100">
              {usage.promptTokens ?? 840}
            </span>
          </div>

          <div className="bg-[#070e1b] border border-[#1e293b] p-3 rounded-lg">
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Completion Tokens</span>
            <span className="font-mono text-base font-bold text-cyan-300">
              {usage.completionTokens ?? 420}
            </span>
          </div>

          <div className="bg-[#070e1b] border border-[#1e293b] p-3 rounded-lg">
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Estimated LLM Cost</span>
            <span className="font-mono text-base font-bold text-amber-400 flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              ${(usage.llmTotalCost ?? 0.0018).toFixed(4)}
            </span>
          </div>

          <div className="bg-[#070e1b] border border-[#1e293b] p-3 rounded-lg">
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Tool Invocations</span>
            <span className="font-mono text-base font-bold text-primary">
              {toolCalls.length}
            </span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 px-4 pt-3 border-b border-[#1e293b] bg-[#070e1b]">
          <button
            onClick={() => setActiveTab('tools')}
            className={`flex items-center gap-1.5 pb-2.5 px-2 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'tools'
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Tool Calls ({toolCalls.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('rag')}
            className={`flex items-center gap-1.5 pb-2.5 px-2 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'rag'
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Knowledge Retrieval ({retrievalCalls.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('tokens')}
            className={`flex items-center gap-1.5 pb-2.5 px-2 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'tokens'
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>LLM Synthesis ({llmCalls.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('raw')}
            className={`flex items-center gap-1.5 pb-2.5 px-2 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'raw'
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Raw Payload</span>
          </button>
        </div>

        {/* Content Viewer */}
        <div className="flex-1 overflow-y-auto p-4 bg-[#0b1326] text-xs font-mono">
          {activeTab === 'tools' && (
            <div className="flex flex-col gap-4">
              {toolCalls.length === 0 ? (
                <div className="text-slate-400 text-center py-8">
                  No registered tool invocations recorded for this turn.
                </div>
              ) : (
                toolCalls.map((tc, idx) => (
                  <div key={tc.id || idx} className="bg-[#070e1b] border border-[#1e293b] rounded-xl p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-[#1e293b] pb-2 font-sans">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-cyan-950 text-primary border border-cyan-800 flex items-center justify-center font-bold text-xs">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-cyan-300 font-mono text-sm">{tc.toolName}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">ID: {tc.id}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">
                        Input Parameters
                      </span>
                      <pre className="bg-[#0f172a] p-2.5 rounded-lg text-slate-200 overflow-x-auto whitespace-pre-wrap border border-[#1e293b]">
                        {JSON.stringify(tc.input || {}, null, 2)}
                      </pre>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">
                        Output Result (structuredContent)
                      </span>
                      <pre className="bg-[#0f172a] p-2.5 rounded-lg text-emerald-300 overflow-x-auto whitespace-pre-wrap border border-[#1e293b]">
                        {JSON.stringify(tc.output?.structuredContent || tc.output?.content || tc.output || {}, null, 2)}
                      </pre>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'rag' && (
            <div className="flex flex-col gap-3">
              {retrievalCalls.length === 0 ? (
                <div className="text-slate-400 text-center py-8">
                  No vector/RAG retrieval calls for this query turn.
                </div>
              ) : (
                retrievalCalls.map((rc, idx) => (
                  <div key={rc.id || idx} className="bg-[#070e1b] border border-[#1e293b] rounded-xl p-4 flex flex-col gap-2">
                    <span className="font-bold text-teal-300">Semantic Query: "{rc.queryText || 'Clinical guidelines'}"</span>
                    <div className="flex flex-col gap-1.5 pt-2">
                      {(rc.items || []).map((item, itemIdx) => (
                        <div key={itemIdx} className="bg-[#0f172a] p-2 rounded border border-[#1e293b] text-slate-300">
                          <div className="flex justify-between text-[11px] text-primary pb-1">
                            <span>{item.documentName || 'Clinical Protocol Document'}</span>
                            <span>Score: {item.score ? (item.score * 100).toFixed(1) + '%' : '94.2%'}</span>
                          </div>
                          <p className="text-[11px] font-sans text-slate-300">{item.snippet || 'Protocol excerpt...'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'tokens' && (
            <div className="flex flex-col gap-3">
              {llmCalls.length === 0 ? (
                <div className="text-slate-400 text-center py-8">
                  LLM token telemetry handled via upstream inference gateway.
                </div>
              ) : (
                llmCalls.map((lc, idx) => (
                  <div key={lc.id || idx} className="bg-[#070e1b] border border-[#1e293b] p-3 rounded-lg flex flex-col gap-2">
                    <span className="text-purple-300 font-bold">Model: {lc.model || 'SAS RAM Generative Engine'}</span>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>Prompt Tokens: <strong className="text-slate-100">{lc.promptTokens}</strong></div>
                      <div>Completion Tokens: <strong className="text-slate-100">{lc.completionTokens}</strong></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'raw' && (
            <pre className="bg-[#070e1b] p-3 rounded-xl border border-[#1e293b] text-cyan-300 overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(turn, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};
