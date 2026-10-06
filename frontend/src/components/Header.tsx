import React from 'react';
import { 
  RefreshCw, 
  Bot, 
  Database, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

interface HeaderProps {
  onRefresh: () => void;
  isRefreshing: boolean;
  currentModule: string;
  onSelectModule: (module: string) => void;
  isRamAuthenticated: boolean;
  onOpenSignIn: () => void;
  selectedFacility: string;
  onSelectFacility: (fac: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onRefresh,
  isRefreshing,
  currentModule,
  onSelectModule,
  isRamAuthenticated,
  onOpenSignIn,
  selectedFacility,
  onSelectFacility,
}) => {
  return (
    <header className="fixed top-0 left-72 right-0 h-[96px] bg-[#0b1326]/95 backdrop-blur-md z-40 border-b border-[#1e293b] shadow-lg flex flex-col justify-between">
      {/* ── ROW 1: BRAND IDENTITY & GLOBAL STATUS ── */}
      <div className="h-12 px-6 flex items-center justify-between border-b border-[#1e293b]/70 min-w-0">
        {/* Full Brand Title & Badge */}
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 glow-cyan shrink-0" />
          <h1 className="font-headline text-sm lg:text-[15px] font-extrabold text-[#dae2fd] tracking-tight whitespace-nowrap truncate">
            Federated Analytics &amp; Healthcare Insights Monitor
          </h1>
          <span className="text-[10px] font-black text-primary px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/80 font-mono shrink-0">
            (F.A.H.I.M.)
          </span>
        </div>

        {/* Global Connection Status & Clinical Lead Profile */}
        <div className="flex items-center gap-3 shrink-0">
          {/* SAS RAM Auth Status Chip */}
          {isRamAuthenticated ? (
            <div 
              title="SAS RAM Agent FAHIM is authenticated and online"
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-950/70 border border-emerald-800 text-emerald-300 text-xs font-bold shrink-0 shadow-xs"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Agent FAHIM Online</span>
            </div>
          ) : (
            <button
              id="btn-agent-auth-status"
              onClick={onOpenSignIn}
              title="Agent FAHIM is disconnected. Click to authenticate with SAS RAM."
              className="flex items-center gap-2 px-3 py-1 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-700/80 text-rose-200 text-xs font-bold transition-all shadow-sm shrink-0 group"
            >
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <AlertCircle className="w-3.5 h-3.5 text-rose-400 group-hover:scale-110 transition-transform" />
              <span>Agent FAHIM Disconnected</span>
              <span className="text-[10px] font-mono uppercase bg-rose-900 px-1.5 py-0.5 rounded text-rose-200 border border-rose-600 font-bold ml-0.5">
                Reconnect
              </span>
            </button>
          )}

          <div className="h-5 w-px bg-[#1e293b] shrink-0" />

          {/* Clinical Lead User Profile */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="text-right">
              <div className="text-xs font-bold text-slate-200 leading-tight">Dr. Tariq M.</div>
              <div className="text-[10px] text-slate-400 font-medium">EHS Clinical Operations Lead</div>
            </div>
            <div 
              title="Dr. Tariq M. — EHS Clinical Operations Lead"
              className="w-8 h-8 rounded-full bg-cyan-950 border border-cyan-700/60 flex items-center justify-center text-primary font-bold text-xs ring-1 ring-cyan-500/30 shadow-sm cursor-default shrink-0"
            >
              TM
            </div>
          </div>
        </div>
      </div>

      {/* ── ROW 2: OPERATIONS TOOLBAR & FACILITY SELECTOR (DOWN ROW) ── */}
      <div className="h-12 px-6 flex items-center justify-between bg-[#070e1b]/80 min-w-0">
        {/* Left: Command Center Context & Hospital Selector */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2 shrink-0 text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Clinical Command Center</span>
            <span className="text-slate-600">•</span>
          </div>

          {/* All 10 Hospitals Toggle */}
          <button
            type="button"
            onClick={() => onSelectFacility('ALL')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border whitespace-nowrap flex items-center gap-1.5 ${
              selectedFacility === 'ALL'
                ? 'bg-cyan-500/20 text-primary border-cyan-500/50 shadow-xs'
                : 'bg-[#0b1326] text-slate-400 hover:text-slate-200 border-[#1e293b]'
            }`}
            title="View aggregated cluster telemetry"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span>All 10 Hospitals</span>
          </button>

          {/* Hospital Node Select */}
          <div className="relative">
            <select
              value={selectedFacility}
              onChange={(e) => onSelectFacility(e.target.value)}
              aria-label="Select Hospital Node"
              className="bg-[#0b1326] hover:bg-[#131d33] border border-[#1e293b] text-slate-200 text-xs font-semibold pl-2.5 pr-7 py-1 rounded-lg outline-none focus:border-primary transition-all cursor-pointer max-w-[260px] truncate appearance-none"
            >
              <option value="ALL">Cluster Master (All 10 EHS Nodes)</option>
              <option value="AQH">AQH — Al Qassimi Hospital (500 beds)</option>
              <option value="FUJ">FUJ — Fujairah Hospital (320 beds)</option>
              <option value="AQWCH">AQWCH — Al Qassimi Women &amp; Children (250 beds)</option>
              <option value="SKMC">SKMC — Sheikh Khalifa Medical City (240 beds)</option>
              <option value="KWH">KWH — Kuwait Hospital Sharjah (180 beds)</option>
              <option value="IBHO">IBHO — Ibrahim Bin Hamad Obaidullah (170 beds)</option>
              <option value="KFK">KFK — Khorfakkan Hospital (160 beds)</option>
              <option value="UAQH">UAQH — Umm Al Quwain Hospital (135 beds)</option>
              <option value="DRA">DRA — Al Dhaid Hospital (120 beds)</option>
              <option value="KALBA">KALBA — Kalba Hospital (110 beds)</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Right: Sync DB Button & Operations Tables Console Toggle (MOVED DOWN) */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Global Table Refresh Button */}
          <button
            id="btn-global-refresh"
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Manually reload live tables and telemetry"
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#0b1326] hover:bg-[#131d33] border border-[#1e293b] text-slate-200 hover:text-primary transition-all text-xs font-semibold shadow-xs"
            type="button"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-primary' : 'text-slate-400'}`} />
            <span>Sync DB</span>
          </button>

          {/* Primary View Switcher: Operations Tables Console / SAS RAM Intelligence Hub */}
          {currentModule === 'sas-ram' ? (
            <button
              id="btn-switch-to-tables"
              onClick={() => onSelectModule('operations-tables')}
              className="flex items-center gap-2 px-3.5 py-1 rounded-lg bg-[#0b1326] hover:bg-[#131d33] border border-cyan-800/80 text-cyan-300 text-xs font-bold transition-all shadow-sm whitespace-nowrap"
              type="button"
            >
              <Database className="w-3.5 h-3.5 text-primary" />
              <span>Operations Tables Console</span>
            </button>
          ) : (
            <button
              id="btn-switch-to-sas-ram"
              onClick={() => onSelectModule('sas-ram')}
              className="flex items-center gap-2 px-3.5 py-1 rounded-lg bg-primary hover:bg-primary-hover text-[#060e20] text-xs font-black transition-all shadow-md whitespace-nowrap"
              type="button"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>SAS RAM Intelligence Hub</span>
              <span className="w-2 h-2 rounded-full bg-[#060e20] animate-pulse" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
