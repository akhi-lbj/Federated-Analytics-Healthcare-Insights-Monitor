import React from 'react';
import { 
  RefreshCw, 
  Bot, 
  Database, 
  ShieldCheck, 
  CheckCircle2, 
  Activity,
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
    <header className="fixed top-0 left-72 right-0 h-18 bg-[#0b1326]/90 backdrop-blur-md z-40 flex items-center justify-between px-5 xl:px-8 border-b border-[#1e293b] shadow-lg">
      {/* Brand Title & Hospital Facility Switcher */}
      <div className="flex items-center gap-4 min-w-0 flex-1 mr-4">
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="font-headline text-[14px] xl:text-[16px] font-extrabold text-[#dae2fd] tracking-tight leading-tight whitespace-nowrap">
              Federated Analytics &amp; Healthcare Insights Monitor
            </h1>
            <span className="text-[10px] xl:text-[11px] font-black text-primary px-1.5 xl:px-2 py-0.5 rounded bg-cyan-950/70 border border-cyan-800/80 flex-shrink-0">
              (F.A.H.I.M.)
            </span>
          </div>
          <div className="flex items-center gap-2.5 mt-0.5">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
              Clinical Command Center<span className="hidden 2xl:inline"> • UAE Regional Network</span>
            </span>
            <span className="text-slate-600 text-xs hidden sm:inline">•</span>
            {/* Facility Selector: Cluster Master & All 10 Hospitals */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                type="button"
                onClick={() => onSelectFacility('ALL')}
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all border whitespace-nowrap ${
                  selectedFacility === 'ALL'
                    ? 'bg-cyan-500/20 text-primary border-cyan-500/40 shadow-xs'
                    : 'bg-[#070e1b] text-slate-400 hover:text-slate-200 border-[#1e293b]'
                }`}
              >
                All 10 Hospitals
              </button>

              <select
                value={selectedFacility}
                onChange={(e) => onSelectFacility(e.target.value)}
                className="bg-[#070e1b] border border-[#1e293b] text-slate-200 text-[10px] font-bold px-2 py-0.5 rounded-md outline-none focus:border-primary transition-all cursor-pointer max-w-[190px] xl:max-w-none truncate"
              >
                <option value="ALL">Cluster Master (All EHS Nodes)</option>
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
            </div>
          </div>
        </div>
      </div>

      {/* Control Actions & Primary View Switcher */}
      <div className="flex items-center gap-2 xl:gap-3 flex-shrink-0">
        {/* Node Connectivity Status */}
        <div className="hidden 2xl:flex items-center gap-2 bg-[#070e1b] border border-[#1e293b] px-3 py-1.5 rounded-full flex-shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">10/10 Nodes Active</span>
          <span className="text-slate-700 text-xs">|</span>
          <span className="text-[10px] text-slate-400 font-mono">TLS v1.3</span>
        </div>

        {/* Global Table Refresh Button */}
        <button
          id="btn-global-refresh"
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Manually reload live tables and telemetry"
          className="flex items-center gap-1.5 xl:gap-2 px-2.5 xl:px-3 py-1.5 rounded-xl bg-[#0f172a] hover:bg-[#1e293b] border border-[#1e293b] text-slate-200 hover:text-primary transition-all text-xs font-semibold shadow-xs"
          type="button"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-primary' : 'text-slate-400'}`} />
          <span className="hidden sm:inline">Sync DB</span>
        </button>

        {/* Primary View Switcher Button (Elevating SAS RAM to Main Character) */}
        {currentModule === 'sas-ram' ? (
          <button
            id="btn-switch-to-tables"
            onClick={() => onSelectModule('operations-tables')}
            className="flex items-center gap-2 px-3 xl:px-3.5 py-1.5 rounded-xl bg-[#0f172a] hover:bg-[#1e293b] border border-cyan-800/80 text-cyan-300 text-xs font-bold transition-all shadow-md whitespace-nowrap"
            type="button"
          >
            <Database className="w-4 h-4 text-primary" />
            <span>Operations Tables Console</span>
          </button>
        ) : (
          <button
            id="btn-switch-to-sas-ram"
            onClick={() => onSelectModule('sas-ram')}
            className="flex items-center gap-2 px-3.5 xl:px-4 py-1.5 rounded-xl bg-primary hover:bg-primary-hover text-[#060e20] text-xs font-black transition-all shadow-lg hover:shadow-cyan-500/20 active:scale-[0.98] whitespace-nowrap"
            type="button"
          >
            <Bot className="w-4 h-4" />
            <span>SAS RAM Intelligence Hub</span>
            <span className="w-2 h-2 rounded-full bg-[#060e20] animate-pulse"></span>
          </button>
        )}

        {/* SAS Auth Status / Sign-in Chip */}
        {isRamAuthenticated ? (
          <div 
            title="SAS RAM Agent FAHIM is authenticated and online"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/70 border border-emerald-800/80 text-emerald-300 text-xs font-bold shadow-xs flex-shrink-0 whitespace-nowrap"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Agent FAHIM Online</span>
          </div>
        ) : (
          <button
            id="btn-agent-auth-status"
            onClick={onOpenSignIn}
            title="Agent FAHIM is disconnected. Click to authenticate with SAS RAM."
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-950/90 hover:bg-rose-900 border border-rose-700/90 text-rose-200 text-xs font-bold transition-all shadow-lg shadow-rose-950/50 animate-pulse hover:animate-none cursor-pointer flex-shrink-0 group whitespace-nowrap"
          >
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            <AlertCircle className="w-3.5 h-3.5 text-rose-400 group-hover:scale-110 transition-transform" />
            <span>Agent FAHIM Disconnected</span>
            <span className="text-[10px] font-mono uppercase bg-rose-900/90 px-1.5 py-0.5 rounded text-rose-200 border border-rose-600 font-bold">
              Reconnect
            </span>
          </button>
        )}

        <div className="h-6 w-px bg-[#1e293b] hidden sm:block flex-shrink-0"></div>

        {/* Clinical Lead Profile */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="text-right hidden xl:block">
            <div className="text-xs font-bold text-slate-200 leading-tight">Dr. Tariq M.</div>
            <div className="text-[10px] text-slate-400 font-medium">EHS Clinical Operations Lead</div>
          </div>
          <div 
            title="Dr. Tariq M. — EHS Clinical Operations Lead"
            className="w-8 h-8 rounded-full bg-cyan-950 border border-cyan-700/50 flex items-center justify-center text-primary font-bold text-xs ring-1 ring-cyan-500/30 shadow-sm cursor-default"
          >
            TM
          </div>
        </div>
      </div>
    </header>
  );
};
