import React, { useState, useEffect, useRef } from 'react';
import { 
  RamTurn, 
  TraceAggregate, 
  RamAttachment, 
  ChartSpec, 
  ReportSpec,
  PresentationSpec 
} from '../../types/ram';
import { 
  streamAgentQuery, 
  listSessions, 
  loadSessionHistory 
} from '../../lib/ramApi';
import { extractPresentations } from '../../lib/ramExtractors';
import { LiveStepIndicator } from './LiveStepIndicator';
import { ToolCallTrace } from './ToolCallTrace';
import { QueryInspectorModal } from './QueryInspectorModal';
import { ChartWidget } from './ChartWidget';
import { ReportWidget } from './ReportWidget';
import { PresentationWidget } from './PresentationWidget';
import { DynamicMarkdown } from '../common/DynamicMarkdown';
import { 
  X, 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  RotateCcw, 
  Eye, 
  ShieldCheck, 
  Layers, 
  FileText 
} from 'lucide-react';

interface RamCopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
  onOpenSignIn: () => void;
}

export const RamCopilotDrawer: React.FC<RamCopilotDrawerProps> = ({
  isOpen,
  onClose,
  isAuthenticated,
  onOpenSignIn,
}) => {
  const [turns, setTurns] = useState<RamTurn[]>([
    {
      id: 'welcome-01',
      role: 'assistant',
      content: `### 🌟 Welcome to Agent FAHIM\n\nI am your clinical intelligence assistant powered by **SAS RAM**, connected to the **Emirates Health Services (EHS)** regional hospital network.\n\nHow can I support your operational shift today?`,
    },
  ]);

  const [inputContent, setInputContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [liveTrace, setLiveTrace] = useState<TraceAggregate | null>(null);
  const [pollTick, setPollTick] = useState(0);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [activeInspectorTurn, setActiveInspectorTurn] = useState<RamTurn | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns, liveTrace, isLoading]);


  const handleSend = async (customPrompt?: string) => {
    const promptToSend = customPrompt || inputContent;
    if (!promptToSend.trim()) return;

    if (!isAuthenticated) {
      onOpenSignIn();
      return;
    }

    const userTurn: RamTurn = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: promptToSend,
      insertTimestamp: new Date().toISOString(),
    };

    setTurns((prev) => [...prev, userTurn]);
    setInputContent('');
    setIsLoading(true);
    setLiveTrace(null);
    setPollTick(0);
    setErrorMsg(null);

    try {
      const response = await streamAgentQuery({
        content: promptToSend,
        sessionId,
        onTraceUpdate: (trace) => setLiveTrace(trace),
        onPollTick: (tick) => setPollTick(tick),
      });

      if (response.querySessionId && !sessionId) {
        setSessionId(response.querySessionId);
      }

      const assistantTurn: RamTurn = {
        id: response.queryId || `asst-${Date.now()}`,
        querySessionId: response.querySessionId,
        role: 'assistant',
        content: response.content,
        status: 'completed',
        sources: response.sources,
        trace: response.trace,
        usageMetadata: response.usageMetadata,
        insertTimestamp: new Date().toISOString(),
      };

      setTurns((prev) => [...prev, assistantTurn]);
    } catch (err: any) {
      const errText = err.message || 'Error executing agent query.';
      setErrorMsg(errText);
      const isPromptTemplateError =
        errText.includes('ChatPromptTemplate') ||
        errText.includes('missing variables') ||
        errText.includes('INVALID_PROMPT_INPUT') ||
        errText.includes('Prompt Template Syntax Error');

      let content = `⚠️ **Agent Execution Error**: ${errText}`;
      if (isPromptTemplateError) {
        content =
          `### ⚠️ Upstream SAS RAM Prompt Template Error\n\n` +
          `The active agent in **SAS Retrieval Agent Manager** contains unescaped curly braces \`{}\` in its system prompt template.\n\n` +
          `**Fix**: In the SAS RAM web console under **Agents**, edit the prompt instructions and escape any literal curly braces by replacing \`{}\` with \`{{}}\`.`;
      }

      setTurns((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content,
          status: 'failed',
        },
      ]);
    } finally {
      setIsLoading(false);
      setLiveTrace(null);
    }
  };

  const extractChartSpecs = (toolCalls?: any[]): ChartSpec[] => {
    if (!toolCalls) return [];
    const specs: ChartSpec[] = [];

    toolCalls.forEach((tc) => {
      const out = tc.output?.structuredContent || tc.output;
      if (out && typeof out === 'object') {
        if (out.kind === 'chart') {
          specs.push(out as ChartSpec);
        } else if (out.charts && Array.isArray(out.charts)) {
          specs.push(...out.charts);
        }
      }
    });

    return specs;
  };

  const extractReportSpecs = (toolCalls?: any[]): ReportSpec[] => {
    if (!toolCalls) return [];
    const specs: ReportSpec[] = [];

    toolCalls.forEach((tc) => {
      const out = tc.output?.structuredContent || tc.output;
      if (out && typeof out === 'object') {
        if (out.kind === 'report_image') {
          specs.push(out as ReportSpec);
        }
      }
    });

    return specs;
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-y-0 right-0 w-full sm:w-[500px] xl:w-[560px] bg-[#0b1326] border-l border-[#1e293b] shadow-2xl z-50 flex flex-col justify-between transition-all">
        {/* Drawer Header */}
        <div className="px-5 py-4 border-b border-[#1e293b] bg-[#070e1b] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-950/80 border border-cyan-800 flex items-center justify-center text-primary">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-headline text-sm font-bold text-slate-100">
                  SAS RAM Clinical Copilot
                </h3>
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              </div>
              <span className="text-[10px] text-slate-400">
                Retrieval Agent Manager v1 • High-Acuity Triage
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setTurns([
                  {
                    id: `new-${Date.now()}`,
                    role: 'assistant',
                    content: 'Started new clinical reasoning session. How can I assist you?',
                  },
                ]);
                setSessionId(undefined);
              }}
              title="Reset conversation"
              className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-[#1e293b] transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-[#1e293b] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Conversation Message Feed */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 text-xs">
          {turns.map((turn, idx) => {
            const isUser = turn.role === 'user';
            const chartSpecs = extractChartSpecs(turn.trace?.toolCalls);
            const reportSpecs = extractReportSpecs(turn.trace?.toolCalls);
            const presentationSpecs = extractPresentations(turn.trace?.toolCalls, turn.content);

            let displayContent = turn.content;
            if (!isUser && (!displayContent || displayContent === 'Analysis complete.')) {
              if (idx > 0 && turns[idx - 1]?.role === 'user') {
                const uPrompt = turns[idx - 1].content.trim().toLowerCase();
                if (/^(hi|hello|hey|greetings|good\s*(morning|afternoon|evening)|salaam|assalamu|who are you|help)\b/i.test(uPrompt)) {
                  displayContent =
                    "Hello! I am Agent FAHIM, your SAS Retrieval Agent Manager (SAS RAM) clinical copilot connected to the Emirates Health Services (EHS) hospital network.\n\n" +
                    "I continuously monitor real-time clinical telemetry from your PostgreSQL database, including ward bed occupancies, emergency department CTAS triage boarding queues, and inter-facility referrals across all 10 EHS regional hospitals.\n\n" +
                    "How can I assist you with clinical operations, capacity analytics, or patient transfers today?";
                }
              }
            }

            return (
              <div
                key={turn.id}
                className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                    isUser
                      ? 'bg-cyan-600 text-white'
                      : 'bg-cyan-950 border border-cyan-800 text-primary'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={`flex flex-col max-w-[85%] rounded-xl p-3.5 shadow-sm leading-relaxed ${
                    isUser
                      ? 'bg-cyan-950/70 border border-cyan-700/60 text-slate-100'
                      : 'bg-[#0f172a] border border-[#1e293b] text-slate-200'
                  }`}
                >
                  {/* Attached files preview */}
                  {turn.attachments && turn.attachments.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-1">
                      {turn.attachments.map((a, i) => (
                        <span
                          key={i}
                          className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-[#070e1b] border border-cyan-900 text-cyan-300"
                        >
                          <FileText className="w-3 h-3 text-primary" />
                          <span>{a.name}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Main Bubble Content (Formatted Markdown & Tables) */}
                  <DynamicMarkdown content={displayContent || 'Analysis complete.'} />

                  {/* PowerPoint Presentation Deck Artifacts */}
                  {presentationSpecs.map((spec, pIdx) => (
                    <PresentationWidget key={pIdx} spec={spec} />
                  ))}

                  {/* Tier 4: Tool-Driven SVG Charts */}
                  {chartSpecs.map((spec, sIdx) => (
                    <ChartWidget key={sIdx} spec={spec} />
                  ))}

                  {/* Tier 4: SAS Visual Analytics Reports */}
                  {reportSpecs.map((spec, rIdx) => (
                    <ReportWidget key={rIdx} spec={spec} />
                  ))}

                  {/* Tier 2: Inline Collapsible Tool Call Summary */}
                  {!isUser && turn.trace?.toolCalls && turn.trace.toolCalls.length > 0 && (
                    <ToolCallTrace
                      toolCalls={turn.trace.toolCalls}
                      onOpenInspector={() => setActiveInspectorTurn(turn)}
                    />
                  )}

                  {/* Timestamp & Inspect trigger */}
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 mt-1 border-t border-[#1e293b]/50">
                    <span>{turn.insertTimestamp ? new Date(turn.insertTimestamp).toLocaleTimeString() : 'Now'}</span>
                    {!isUser && (
                      <button
                        onClick={() => setActiveInspectorTurn(turn)}
                        className="flex items-center gap-1 text-slate-400 hover:text-primary transition-colors font-mono"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Audit Specs</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Tier 1: Mid-Flight Live Execution Indicator */}
          {isLoading && liveTrace && (
            <LiveStepIndicator trace={liveTrace} pollTick={pollTick} />
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Preset Prompt Suggestions */}
        <div className="px-4 py-2 bg-[#070e1b] border-t border-[#1e293b] flex items-center gap-1.5 overflow-x-auto">
          <span className="text-[10px] font-bold text-slate-500 uppercase flex-shrink-0">
            Suggested:
          </span>
          {[
            'Analyze AQH CCU capacity',
            'List CTAS 1 & 2 boarding delays',
            'Plot ward occupancy trend',
          ].map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => handleSend(prompt)}
              className="px-2.5 py-1 rounded bg-[#0f172a] hover:bg-[#1e293b] text-cyan-300 border border-[#1e293b] text-[10px] whitespace-nowrap transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-[#070e1b] border-t border-[#1e293b] flex flex-col gap-2.5">
          <div className="flex items-end gap-2 bg-[#0b1326] border border-[#1e293b] rounded-xl p-2 focus-within:border-primary transition-all">
            <textarea
              value={inputContent}
              onChange={(e) => setInputContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Query SAS RAM clinical agent (e.g. assess CCU telemetry overload)..."
              rows={2}
              className="w-full bg-transparent text-slate-100 text-xs outline-none resize-none placeholder:text-slate-500 p-1"
            />

            <button
              type="button"
              onClick={() => handleSend()}
              disabled={isLoading || !inputContent.trim()}
              className="w-8 h-8 rounded-lg bg-primary hover:bg-primary-hover disabled:bg-slate-800 disabled:text-slate-600 text-[#060e20] flex items-center justify-center transition-all flex-shrink-0 font-bold"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-500 px-1">
            <span>Press <kbd className="font-mono bg-[#1e293b] text-slate-300 px-1 rounded">Enter</kbd> to dispatch</span>
            <span>504-Timeout Immune Poller Active</span>
          </div>
        </div>
      </div>

      {/* Tier 3: Deep Observability Modal & Audit Drawer */}
      <QueryInspectorModal
        isOpen={Boolean(activeInspectorTurn)}
        onClose={() => setActiveInspectorTurn(null)}
        turn={activeInspectorTurn}
      />
    </>
  );
};
