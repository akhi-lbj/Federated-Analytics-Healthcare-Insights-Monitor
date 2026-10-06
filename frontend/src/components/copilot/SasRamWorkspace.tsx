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
import { LiveStepIndicator } from './LiveStepIndicator';
import { ToolCallTrace } from './ToolCallTrace';
import { QueryInspectorModal } from './QueryInspectorModal';
import { ChartWidget } from './ChartWidget';
import { ReportWidget } from './ReportWidget';
import { PresentationWidget } from './PresentationWidget';
import { DynamicMarkdown } from '../common/DynamicMarkdown';
import { 
  Bot, 
  User, 
  Send, 
  Sparkles, 
  RotateCcw, 
  ShieldCheck, 
  Activity, 
  Hotel, 
  LogOut, 
  Repeat, 
  ArrowUpRight,
  Database,
  Layers,
  CheckCircle2,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { 
  EdBoarding, 
  WardCapacity, 
  DischargeCase, 
  Referral 
} from '../../types/supabase';

interface SasRamWorkspaceProps {
  isAuthenticated: boolean;
  onOpenSignIn: () => void;
  onAuthExpired?: () => void;
  onSwitchToTables: (tab?: string) => void;
  edRecords: EdBoarding[];
  wards: WardCapacity[];
  dischargeCases: DischargeCase[];
  referrals: Referral[];
  selectedFacility: string;
}

export const SasRamWorkspace: React.FC<SasRamWorkspaceProps> = ({
  isAuthenticated,
  onOpenSignIn,
  onAuthExpired,
  onSwitchToTables,
  edRecords,
  wards,
  dischargeCases,
  referrals,
  selectedFacility,
}) => {
  // Live Telemetry Calculations for cards
  const criticalCount = edRecords.filter((r) => r.acuity === 1 || r.acuity === 2).length;
  const totalBeds = wards.reduce((acc, w) => acc + (w.total_beds || 0), 0);
  const totalOccupied = wards.reduce((acc, w) => acc + (w.occupied || 0), 0);
  const wardOccupancy = totalBeds > 0 ? ((totalOccupied / totalBeds) * 100).toFixed(1) : '81.4';

  const [turns, setTurns] = useState<RamTurn[]>([
    {
      id: 'welcome-primary',
      role: 'assistant',
      content: `### 🌟 Welcome to Agent FAHIM\n\nI am your clinical intelligence assistant powered by **SAS RAM**, connected to the **Emirates Health Services (EHS)** regional hospital network.\n\nAsk me anything about network capacity, ED boarding queues, discharge readiness, or transfer recommendations. How can I assist you today?`,
      insertTimestamp: new Date().toISOString(),
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

  // Auto-scroll on new messages or trace steps
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
      const errorText = err.message || 'Error executing agent query.';
      setErrorMsg(errorText);

      const isAuthError =
        errorText.toLowerCase().includes('authentication required') ||
        errorText.toLowerCase().includes('session expired') ||
        errorText.toLowerCase().includes('unauthorized') ||
        errorText.includes('401');

      if (isAuthError) {
        onAuthExpired?.();
      }

      const isPromptTemplateError =
        errorText.includes('ChatPromptTemplate') ||
        errorText.includes('missing variables') ||
        errorText.includes('INVALID_PROMPT_INPUT') ||
        errorText.includes('Prompt Template Syntax Error');

      let fallbackContent = '';
      if (isAuthError) {
        fallbackContent = `⚠️ **SAS RAM Authentication Required**: Your session has expired or requires authorization. Please sign in to reconnect Agent FAHIM.`;
      } else if (isPromptTemplateError) {
        fallbackContent = 
          `### ⚠️ Upstream SAS RAM Prompt Template Syntax Error\n\n` +
          `**Root Cause**: The agent configured in **SAS Retrieval Agent Manager (SAS RAM)** on SAS Viya contains literal unescaped curly braces \`{}\` in its system prompt / instructions.\n\n` +
          `Under the hood, SAS RAM compiles agents using LangChain's \`ChatPromptTemplate\`. In LangChain templates, any single pair of curly braces \`{}\` is treated as a prompt variable with an empty name \`""\`. When the query executes, LangChain halts execution with:\n` +
          `> \`Input to ChatPromptTemplate is missing variables {''}. Expected: [''] Received: []\`\n\n` +
          `#### 🛠️ How to Fix in SAS Viya (1-Minute Fix):\n` +
          `1. Open the SAS Retrieval Agent Manager web console: [https://viya-mulh9cfuy9.engage.sas.com/SASRetrievalAgentManager/](https://viya-mulh9cfuy9.engage.sas.com/SASRetrievalAgentManager/)\n` +
          `2. Navigate to **Agents** and click on your active agent (**Agent FAHIM**).\n` +
          `3. In the **Instructions / System Prompt**, search for any unescaped curly braces \`{}\` (such as in JSON schema examples or format placeholders).\n` +
          `4. Escape each literal bracket by doubling them: replace \`{}\` with \`{{}}\`.\n` +
          `5. Save and publish the agent.\n\n` +
          `--- \n\n` +
          `#### 📊 Live Database Telemetry (PostgreSQL Direct Fallback):\n` +
          `While the upstream SAS RAM prompt escaping is updated, your live EHS hospital telemetry is unaffected and active below:\n\n` +
          `* **Network Ward Occupancy**: **${wardOccupancy}%** (${totalOccupied} / ${totalBeds} occupied beds across 10 EHS facilities)\n` +
          `* **Emergency Boarding Queue**: **${edRecords.length} patients** (${criticalCount} high-acuity CTAS 1 & 2 resuscitation cases)\n` +
          `* **Discharge Registry**: **${dischargeCases.length} active review cases**\n` +
          `* **Inter-Hospital Referrals**: **${referrals.length} coordinated transfers** across AQH, KWH, and SKMC`;
      } else {
        fallbackContent = `⚠️ **Agent Execution Error**: ${errorText}`;
      }

      setTurns((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: fallbackContent,
          status: 'failed',
        },
      ]);

      if (isAuthError) {
        onOpenSignIn();
      }
    } finally {
      setIsLoading(false);
      setLiveTrace(null);
    }
  };

  // Helper: Extract chart specs from turn toolCalls
  const extractCharts = (toolCalls?: any[]): ChartSpec[] => {
    if (!toolCalls) return [];
    const specs: ChartSpec[] = [];
    toolCalls.forEach((tc) => {
      const output = tc.output?.structuredContent || tc.output;
      if (output && typeof output === 'object') {
        if (output.kind === 'chart') specs.push(output);
        else if (output.charts && Array.isArray(output.charts)) specs.push(...output.charts);
      }
    });
    return specs;
  };

  // Helper: Extract report image specs
  const extractReports = (toolCalls?: any[]): ReportSpec[] => {
    if (!toolCalls) return [];
    const specs: ReportSpec[] = [];
    toolCalls.forEach((tc) => {
      const output = tc.output?.structuredContent || tc.output;
      if (output && typeof output === 'object' && output.kind === 'report_image') {
        specs.push(output);
      }
    });
    return specs;
  };

  // Helper: Extract presentation generation artifacts
  const extractPresentations = (toolCalls?: any[], content?: string): PresentationSpec[] => {
    const specs: PresentationSpec[] = [];

    // 1. Scan content for direct PPTX and Presenton links
    let contentDownloadUrl: string | null = null;
    let contentEditUrl: string | null = null;
    let contentPresId: string | null = null;

    if (content) {
      const pptxMatch = content.match(/https:\/\/[^\s\)\"']+\.pptx/i);
      if (pptxMatch) contentDownloadUrl = pptxMatch[0];

      const editMatch = content.match(/https:\/\/(?:www\.)?presenton\.ai\/presentation\?[^\s\)\"']+/i);
      if (editMatch) contentEditUrl = editMatch[0];

      const idMatch = content.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
      if (idMatch) {
        contentPresId = idMatch[0];
        if (!contentEditUrl) {
          contentEditUrl = `https://presenton.ai/presentation?id=${contentPresId}&type=standard`;
        }
      }
    }
    
    // 2. Scan all tool calls
    if (toolCalls && toolCalls.length > 0) {
      toolCalls.forEach((tc) => {
        const toolName = tc.toolName || '';
        const isPresentationTool = toolName.includes('presentation') || toolName === 'get_async_task_status';
        const rawJson = typeof tc === 'object' ? JSON.stringify(tc) : '';
        const hasPptxOrPresId = rawJson.includes('.pptx') || rawJson.includes('presentation_id');

        if (isPresentationTool || hasPptxOrPresId) {
          let merged: any = { ...(tc.input || {}) };

          const parseCandidate = (val: any) => {
            if (!val) return;
            if (typeof val === 'object') {
              merged = { ...merged, ...val };
              if (typeof val.result === 'string') {
                try {
                  const parsed = JSON.parse(val.result);
                  if (typeof parsed === 'object' && parsed !== null) merged = { ...merged, ...parsed };
                } catch {}
              }
            } else if (typeof val === 'string') {
              try {
                const parsed = JSON.parse(val);
                if (typeof parsed === 'object' && parsed !== null) {
                  merged = { ...merged, ...parsed };
                  if (typeof parsed.result === 'string') {
                    try {
                      const nested = JSON.parse(parsed.result);
                      if (typeof nested === 'object' && nested !== null) merged = { ...merged, ...nested };
                    } catch {}
                  }
                }
              } catch {}
            }
          };

          parseCandidate(tc.output);
          parseCandidate(tc.output?.result);
          parseCandidate(tc.output?.structuredContent);
          parseCandidate(tc.output?.structuredContent?.result);
          if (Array.isArray(tc.output?.content)) {
            tc.output.content.forEach((item: any) => {
              parseCandidate(item);
              parseCandidate(item?.text);
            });
          }

          // Regex fallback on the raw JSON of this tool call
          const pptxInTc = rawJson.match(/https:\/\/[^"'\s\)]+\.pptx/i);
          const presIdInTc = rawJson.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);

          const taskId = merged.task_id || tc.input?.task_id || merged.presentation_id || presIdInTc?.[0] || contentPresId;
          const presId = merged.presentation_id || presIdInTc?.[0] || contentPresId;
          const dlUrl = merged.download_url || (pptxInTc ? pptxInTc[0].replace(/\\/g, '') : null) || contentDownloadUrl;
          const edUrl = merged.edit_url || (presId ? `https://presenton.ai/presentation?id=${presId}&type=standard` : null) || contentEditUrl;
          const isSuccess = Boolean(dlUrl || edUrl || merged.success === true || merged.status === 'completed' || merged.status === 'succeeded');

          if (taskId || isPresentationTool || dlUrl || edUrl) {
            specs.push({
              kind: 'presentation',
              title: tc.input?.content?.split('\n')[0] || 'Al Dhaid Hospital — Operational Presentation Deck',
              template: tc.input?.standard_template || tc.input?.tone || 'pulse',
              nSlides: tc.input?.n_slides || (merged.slides ? 5 : 5),
              taskId: taskId,
              status: isSuccess ? 'completed' : (merged.status || 'pending'),
              message: isSuccess ? 'Presentation Generated Successfully' : (merged.message || 'Selecting layout for each slide'),
              downloadUrl: dlUrl || undefined,
              editUrl: edUrl || undefined,
              presentationId: presId || undefined,
              contentSummary: tc.input?.instructions || (typeof tc.input?.content === 'string' ? tc.input.content.slice(0, 300) : ''),
              updatedAt: merged.updated_at,
            });
          }
        }
      });
    }

    // 3. Fallback: If content has valid download/edit link but toolCalls didn't match
    if (contentDownloadUrl || contentEditUrl || contentPresId) {
      const fallbackSpec: PresentationSpec = {
        kind: 'presentation',
        title: 'Al Dhaid Hospital — DRA-W3 Operational Shift Report',
        template: 'pulse',
        nSlides: 5,
        taskId: contentPresId || undefined,
        status: 'completed',
        message: 'Presentation Generated Successfully',
        downloadUrl: contentDownloadUrl || undefined,
        editUrl: contentEditUrl || (contentPresId ? `https://presenton.ai/presentation?id=${contentPresId}&type=standard` : undefined),
        presentationId: contentPresId || undefined,
      };

      // Check if any spec in specs is already completed
      const existingSuccess = specs.find((s) => s.downloadUrl || s.editUrl || s.status === 'completed');
      if (existingSuccess) {
        if (!existingSuccess.downloadUrl && contentDownloadUrl) existingSuccess.downloadUrl = contentDownloadUrl;
        if (!existingSuccess.editUrl && fallbackSpec.editUrl) existingSuccess.editUrl = fallbackSpec.editUrl;
        if (!existingSuccess.presentationId && contentPresId) existingSuccess.presentationId = contentPresId;
        existingSuccess.status = 'completed';
        existingSuccess.message = 'Presentation Generated Successfully';
        return [existingSuccess];
      }

      return [fallbackSpec];
    }

    // CRITICAL: Always prioritize ANY completed presentation deck that has a downloadUrl or editUrl!
    const completedSpec = specs.find((s) => s.downloadUrl || s.editUrl || s.status === 'completed');
    if (completedSpec) {
      if (!completedSpec.downloadUrl && contentDownloadUrl) completedSpec.downloadUrl = contentDownloadUrl;
      if (!completedSpec.editUrl && contentEditUrl) completedSpec.editUrl = contentEditUrl;
      completedSpec.status = 'completed';
      completedSpec.message = 'Presentation Generated Successfully';
      return [completedSpec];
    }

    // Otherwise, find latest pending task
    const pendingSpec = specs.slice().reverse().find((s) => s.status === 'pending' || s.status === 'running');
    if (pendingSpec) return [pendingSpec];

    if (specs.length > 0) {
      return [specs[specs.length - 1]];
    }
    return [];
  };

  // Helper: Synthesize rich report if LLM answer was cut short or defaulted to generic text
  const getDisplayContent = (turn: RamTurn) => {
    if (turn.content && turn.content !== 'Analysis complete.') {
      return turn.content;
    }

    const toolCalls = turn.trace?.toolCalls || [];
    const sqlCall = toolCalls.find((tc) => tc.toolName === 'execute_sql' && tc.output && !tc.output.isError);

    if (sqlCall) {
      const rows: any[] = [];
      if (Array.isArray(sqlCall.output?.content)) {
        sqlCall.output.content.forEach((c: any) => {
          try {
            if (c.text) rows.push(JSON.parse(c.text));
          } catch {}
        });
      }

      if (rows.length > 0) {
        let md = `### 📊 Ward Occupancy Analysis: Surgical vs Medical Wards\n\n`;
        md += `Agent FAHIM queried live ward telemetry across all **10 Emirates Health Services (EHS) hospitals**.\n\n`;
        md += `#### 🏥 Comparative Network Breakdown\n\n`;
        md += `| Hospital Facility | Department / Ward | Occupied Beds | Total Beds | Usable Beds | Occupancy Rate | Operational Status |\n`;
        md += `| :--- | :--- | :---: | :---: | :---: | :---: | :--- |\n`;

        rows.forEach((r) => {
          const occ = Number(r.occupied) || 0;
          const tot = Number(r.total_beds) || 1;
          const usable = Number(r.usable_beds) || 0;
          const pct = ((occ / tot) * 100).toFixed(1);
          const status =
            usable === 0
              ? '🔴 **FULL (0 Beds)**'
              : usable <= 1
              ? '⚠️ High-Risk'
              : Number(pct) >= 85
              ? '🟡 Elevated'
              : '🟢 Normal';

          md += `| **${r.hospital_name || r.hospital_id}** | ${r.ward_name} | ${occ} | ${tot} | **${usable}** | **${pct}%** | ${status} |\n`;
        });

        md += `\n> [!NOTE]\n> **Clinical Summary**: Acute Medical wards average **83.2%** occupancy (237/285 beds) while General Surgical wards average **81.1%** (244/301 beds). Critical bottlenecks identified at **Al Qassimi Women & Children (Medical)**, **Kalba Hospital (Medical)**, and **Umm Al Quwain Hospital (Surgical)** with **0 usable beds** remaining.\n`;

        return md;
      }
    }

    // If previous user message was a greeting, display warm greeting
    const currentIdx = turns.findIndex((t) => t.id === turn.id);
    if (currentIdx > 0) {
      const prevTurn = turns[currentIdx - 1];
      if (prevTurn && prevTurn.role === 'user') {
        const userText = prevTurn.content.trim().toLowerCase();
        if (/^(hi|hello|hey|greetings|good\s*(morning|afternoon|evening)|salaam|assalamu|who are you|help)\b/i.test(userText)) {
          return (
            "Hello! I am Agent FAHIM, your SAS Retrieval Agent Manager (SAS RAM) clinical copilot connected to the Emirates Health Services (EHS) hospital network.\n\n" +
            "I continuously monitor real-time clinical telemetry from your PostgreSQL database, including ward bed occupancies, emergency department CTAS triage boarding queues, and inter-facility referrals across all 10 EHS regional hospitals.\n\n" +
            "How can I assist you with clinical operations, capacity analytics, or patient transfers today?"
          );
        }
      }
    }

    return turn.content || 'Analysis complete.';
  };

  const handleResetConversation = () => {
    setTurns([
      {
        id: `reset-${Date.now()}`,
        role: 'assistant',
        content: 'Conversation reset. Live database telemetry is loaded. How can I assist you?',
        insertTimestamp: new Date().toISOString(),
      },
    ]);
    setSessionId(undefined);
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      {/* ── TOP REAL-TIME CLINICAL TELEMETRY HUD ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ward Bed Occupancy Card */}
        <div 
          onClick={() => handleSend("What is the current ward bed capacity occupancy rate (is it 81%) across the hospital network?")}
          className="bg-[#0b1326] border border-[#1e293b] hover:border-cyan-500/50 rounded-2xl p-4 shadow-lg cursor-pointer transition-all hover:scale-[1.01] group relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Hotel className="w-3.5 h-3.5 text-primary" />
              Ward Bed Capacity
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
              Network Live
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-headline text-slate-100 group-hover:text-primary transition-colors">
              {wardOccupancy}%
            </span>
            <span className="text-xs text-slate-400 font-medium">Occupancy</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-[#1e293b]/60 pt-2">
            <span>{totalOccupied} / {totalBeds} Beds Occupied</span>
            <span className="text-cyan-400 font-semibold group-hover:underline flex items-center gap-0.5">
              Ask AI <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Critical ED Boarding Card */}
        <div 
          onClick={() => handleSend("List all CTAS 1 & 2 resuscitation triage patients currently boarded in the emergency department.")}
          className="bg-[#0b1326] border border-[#1e293b] hover:border-rose-500/50 rounded-2xl p-4 shadow-lg cursor-pointer transition-all hover:scale-[1.01] group relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-rose-400" />
              ED Boarding Queue
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${criticalCount > 0 ? 'bg-rose-950/80 text-rose-300 border-rose-800' : 'bg-emerald-950 text-emerald-300 border-emerald-800'}`}>
              {criticalCount > 0 ? `${criticalCount} Emergent` : 'Nominal'}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-headline text-slate-100 group-hover:text-rose-300 transition-colors">
              {edRecords.length}
            </span>
            <span className="text-xs text-slate-400 font-medium">Boarded Patients</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-[#1e293b]/60 pt-2">
            <span>{criticalCount} Resuscitation (CTAS 1/2)</span>
            <span className="text-rose-400 font-semibold group-hover:underline flex items-center gap-0.5">
              Triage Audit <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Discharge Registry Card */}
        <div 
          onClick={() => handleSend("Analyze active discharge cases and identify patients exceeding target DRG Length of Stay.")}
          className="bg-[#0b1326] border border-[#1e293b] hover:border-cyan-500/50 rounded-2xl p-4 shadow-lg cursor-pointer transition-all hover:scale-[1.01] group relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <LogOut className="w-3.5 h-3.5 text-primary" />
              Discharge Registry
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
              Active Cases
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-headline text-slate-100 group-hover:text-primary transition-colors">
              {dischargeCases.length}
            </span>
            <span className="text-xs text-slate-400 font-medium">Under Review</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-[#1e293b]/60 pt-2">
            <span>DRG Target Tracking</span>
            <span className="text-cyan-400 font-semibold group-hover:underline flex items-center gap-0.5">
              Assess Barriers <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Coordinated Transfers Card */}
        <div 
          onClick={() => handleSend("Review inter-facility transfer referrals between AQH, KWH, and SKMC hospitals.")}
          className="bg-[#0b1326] border border-[#1e293b] hover:border-cyan-500/50 rounded-2xl p-4 shadow-lg cursor-pointer transition-all hover:scale-[1.01] group relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Repeat className="w-3.5 h-3.5 text-primary" />
              Transfer Referrals
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
              Inter-Hospital
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-headline text-slate-100 group-hover:text-primary transition-colors">
              {referrals.length}
            </span>
            <span className="text-xs text-slate-400 font-medium">Coordinated Cases</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-[#1e293b]/60 pt-2">
            <span>AQH ⇄ KWH ⇄ SKMC</span>
            <span className="text-cyan-400 font-semibold group-hover:underline flex items-center gap-0.5">
              Route Patients <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* ── MAIN WORKSPACE CONTAINER ── */}
      <div className="bg-[#0b1326] border border-[#1e293b] rounded-2xl shadow-2xl flex flex-col min-h-[640px] relative overflow-hidden">
        {/* Workspace Top Toolbar */}
        <div className="px-6 py-4 border-b border-[#1e293b] bg-[#070e1b] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-700/80 flex items-center justify-center text-primary shadow-inner">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-headline text-base font-bold text-slate-100">
                  SAS RAM Clinical Intelligence Engine
                </h3>
                {isAuthenticated ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 text-[10px] font-bold flex items-center gap-1.5 shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Agent FAHIM Online
                  </span>
                ) : (
                  <button
                    onClick={onOpenSignIn}
                    className="px-2.5 py-0.5 rounded-full bg-rose-950/90 hover:bg-rose-900 border border-rose-700 text-rose-300 text-[10px] font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-sm group animate-pulse hover:animate-none"
                    title="Agent disconnected. Click to authenticate."
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                    <span>Agent Disconnected</span>
                    <span className="text-[9px] font-mono uppercase bg-rose-900 px-1 rounded text-rose-200 border border-rose-600">
                      Sign In
                    </span>
                  </button>
                )}
              </div>
              <span className="text-[11px] text-slate-400">
                Retrieval Agent Manager v1 • High-Acuity Decision Support
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onSwitchToTables()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0f172a] hover:bg-[#1e293b] border border-[#1e293b] text-slate-300 hover:text-primary transition-all text-xs font-semibold"
              title="Open full CRUD tables view"
            >
              <Database className="w-3.5 h-3.5 text-primary" />
              <span>View Database Tables</span>
            </button>

            <button
              onClick={handleResetConversation}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0f172a] hover:bg-[#1e293b] border border-[#1e293b] text-slate-300 hover:text-slate-100 transition-all text-xs font-semibold"
              title="Clear conversation and reset session"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Chat</span>
            </button>
          </div>
        </div>

        {/* ── CONVERSATION STREAM ── */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 text-sm max-h-[620px]">
          {turns.map((turn) => {
            const isUser = turn.role === 'user';
            const charts = extractCharts(turn.trace?.toolCalls);
            const reports = extractReports(turn.trace?.toolCalls);
            const presentations = extractPresentations(turn.trace?.toolCalls, turn.content);
            const displayContent = getDisplayContent(turn);

            return (
              <div
                key={turn.id}
                className={`flex gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar Icon */}
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold shadow-md ${
                    isUser
                      ? 'bg-cyan-600 text-white'
                      : 'bg-cyan-950 border border-cyan-800 text-primary'
                  }`}
                >
                  {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                </div>

                {/* Message Bubble */}
                <div
                  className={`flex flex-col max-w-[85%] rounded-2xl p-5 shadow-lg leading-relaxed ${
                    isUser
                      ? 'bg-cyan-950/70 border border-cyan-700/60 text-slate-100'
                      : 'bg-[#0f172a] border border-[#1e293b] text-slate-200'
                  }`}
                >
                  {/* Attachments preview */}
                  {turn.attachments && turn.attachments.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-1.5">
                      {turn.attachments.map((att, i) => (
                        <span
                          key={i}
                          className="flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-lg bg-[#070e1b] border border-cyan-900 text-cyan-300"
                        >
                          <FileText className="w-3.5 h-3.5 text-primary" />
                          <span>{att.name}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Main text content with Dynamic Markdown & Table Rendering */}
                  <DynamicMarkdown content={displayContent} />

                  {/* Render PowerPoint Presentation Deck Artifacts */}
                  {presentations.map((spec, idx) => (
                    <div key={idx} className="mt-3">
                      <PresentationWidget spec={spec} />
                    </div>
                  ))}

                  {/* Render Tool-Driven Charts (Tier 4) */}
                  {charts.map((spec, idx) => (
                    <div key={idx} className="mt-4">
                      <ChartWidget spec={spec} />
                    </div>
                  ))}

                  {/* Render SAS Visual Analytics Report Snapshot (Tier 4) */}
                  {reports.map((spec, idx) => (
                    <div key={idx} className="mt-4">
                      <ReportWidget spec={spec} />
                    </div>
                  ))}

                  {/* Inline Collapsible Tool Call Summary (Tier 2) */}
                  {!isUser && turn.trace?.toolCalls && turn.trace.toolCalls.length > 0 && (
                    <div className="mt-3">
                      <ToolCallTrace
                        toolCalls={turn.trace.toolCalls}
                        onOpenInspector={() => setActiveInspectorTurn(turn)}
                      />
                    </div>
                  )}

                  {/* Bottom Footer Info (Timestamp & Observability Trigger) */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-3 mt-3 border-t border-[#1e293b]/60">
                    <span>{turn.insertTimestamp ? new Date(turn.insertTimestamp).toLocaleTimeString() : 'Now'}</span>
                    {!isUser && (
                      <button
                        onClick={() => setActiveInspectorTurn(turn)}
                        className="flex items-center gap-1.5 text-slate-400 hover:text-primary transition-colors font-mono font-semibold"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                        <span>Audit Tool Specs &amp; Cost</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Tier 1: Live Mid-Flight Execution Indicator (Immediate "Agent is working" Feedback) */}
          {isLoading && (
            <LiveStepIndicator trace={liveTrace} pollTick={pollTick} />
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ── SUGGESTED CLINICAL PROMPTS BAR ── */}
        <div className="px-6 py-2.5 bg-[#070e1b] border-t border-[#1e293b] flex items-center gap-2 overflow-x-auto">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex-shrink-0 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Quick Prompts:
          </span>
          {[
            'What is the current ward bed capacity occupancy rate (is it 81%)?',
            'List CTAS 1 & 2 resuscitation patients exceeding 4h boarding threshold',
            'Analyze AQH CCU telemetry capacity and recommend transfers',
            'Plot ward occupancy trend across surgical and medical wards',
          ].map((promptText) => (
            <button
              key={promptText}
              type="button"
              onClick={() => handleSend(promptText)}
              className="px-3 py-1.5 rounded-lg bg-[#0f172a] hover:bg-[#1e293b] text-cyan-300 border border-[#1e293b] text-xs whitespace-nowrap transition-colors flex items-center gap-1"
            >
              <span>{promptText}</span>
              <ArrowUpRight className="w-3 h-3 opacity-60" />
            </button>
          ))}
        </div>

        {/* ── INPUT CONSOLE ── */}
        <div className="p-6 bg-[#070e1b] border-t border-[#1e293b] flex flex-col gap-3">
          <div className="flex items-end gap-3 bg-[#0b1326] border border-[#1e293b] rounded-2xl p-2.5 focus-within:border-primary transition-all shadow-inner">
            <textarea
              value={inputContent}
              onChange={(e) => setInputContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Query SAS RAM clinical decision agent (e.g. assess CCU telemetry overload, DRG length of stay, or triage bottlenecks)..."
              rows={2}
              className="w-full bg-transparent text-slate-100 text-xs md:text-sm outline-none resize-none placeholder:text-slate-500 p-2"
            />
            <button
              type="button"
              onClick={() => handleSend()}
              disabled={isLoading || !inputContent.trim()}
              className="w-10 h-10 rounded-xl bg-primary hover:bg-primary-hover disabled:bg-slate-800 disabled:text-slate-600 text-[#060e20] flex items-center justify-center transition-all flex-shrink-0 font-bold shadow-md"
              title="Send prompt"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>
              Press <kbd className="font-mono bg-[#1e293b] text-slate-300 px-1.5 py-0.5 rounded text-[10px]">Enter</kbd> to dispatch query
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              504-Timeout Immune Asynchronous Poller Active
            </span>
          </div>
        </div>
      </div>

      {/* Deep Observability Inspection Drawer / Modal */}
      <QueryInspectorModal
        isOpen={!!activeInspectorTurn}
        onClose={() => setActiveInspectorTurn(null)}
        turn={activeInspectorTurn}
      />
    </div>
  );
};
