import React from 'react';
import { WardCapacity } from '../../types/supabase';
import { Hotel, HeartPulse, Wind, RefreshCw, AlertCircle } from 'lucide-react';

interface WardCapacityModuleProps {
  wards: WardCapacity[];
  onRefresh: () => void;
  selectedFacility: string;
}

export const WardCapacityModule: React.FC<WardCapacityModuleProps> = ({
  wards,
  onRefresh,
  selectedFacility,
}) => {
  const filtered = selectedFacility === 'ALL'
    ? wards
    : wards.filter((w) => w.hospital_id === selectedFacility);

  const totalBedsAll = filtered.reduce((acc, w) => acc + (w.total_beds || 0), 0);
  const totalOccupiedAll = filtered.reduce((acc, w) => acc + (w.occupied || 0), 0);
  const totalUsableAll = filtered.reduce((acc, w) => acc + (w.usable_beds || 0), 0);
  const avgOccupancy = totalBedsAll > 0 ? Math.round((totalOccupiedAll / totalBedsAll) * 100) : 0;

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto gap-6">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#0f172a] border border-[#1e293b] p-4 rounded-xl flex items-center justify-between shadow-md">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Ward Beds</span>
            <span className="font-mono text-2xl font-black text-slate-100">{totalBedsAll}</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-cyan-950/70 border border-cyan-800 flex items-center justify-center text-primary">
            <Hotel className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#0f172a] border border-[#1e293b] p-4 rounded-xl flex items-center justify-between shadow-md">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Occupied Beds</span>
            <span className="font-mono text-2xl font-black text-amber-400">{totalOccupiedAll}</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-950/70 border border-amber-800 flex items-center justify-center text-amber-400">
            <Hotel className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#0f172a] border border-[#1e293b] p-4 rounded-xl flex items-center justify-between shadow-md">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Immediately Usable</span>
            <span className="font-mono text-2xl font-black text-emerald-400">{totalUsableAll}</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-950/70 border border-emerald-800 flex items-center justify-center text-emerald-400">
            <Hotel className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#0f172a] border border-[#1e293b] p-4 rounded-xl flex items-center justify-between shadow-md">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Cluster Occupancy Rate</span>
            <span className="font-mono text-2xl font-black text-primary">{avgOccupancy}%</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-cyan-950/70 border border-cyan-800 flex items-center justify-center text-primary">
            <RefreshCw className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Ward Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((ward) => {
          const occPercent = ward.total_beds > 0 ? Math.round((ward.occupied / ward.total_beds) * 100) : 0;
          const isHigh = occPercent >= 90;

          return (
            <div
              key={ward.id}
              className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-5 shadow-lg flex flex-col justify-between gap-4 hover:border-slate-600 transition-all"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
                  <div>
                    <span className="text-[10px] font-bold text-primary uppercase font-mono tracking-wider">
                      {ward.hospital_id} Node
                    </span>
                    <h3 className="font-headline text-base font-bold text-slate-100">{ward.ward_name}</h3>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      isHigh
                        ? 'bg-rose-950/70 text-rose-300 border-rose-800'
                        : 'bg-emerald-950/70 text-emerald-300 border-emerald-800'
                    }`}
                  >
                    {occPercent}% Occupied
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="mt-3 flex flex-col gap-1">
                  <div className="flex justify-between text-xs text-slate-400 font-medium">
                    <span>Capacity Status</span>
                    <span>{ward.occupied} / {ward.total_beds} Beds</span>
                  </div>
                  <div className="w-full bg-[#060e20] h-2 rounded-full overflow-hidden border border-[#1e293b]">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isHigh ? 'bg-rose-500' : 'bg-primary'
                      }`}
                      style={{ width: `${Math.min(100, occPercent)}%` }}
                    />
                  </div>
                </div>

                {/* Breakdown metrics */}
                <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                  <div className="bg-[#070e1b] border border-[#1e293b] p-2 rounded">
                    <span className="text-[10px] text-slate-400 block font-medium">Usable</span>
                    <span className="font-mono text-sm font-bold text-emerald-400">{ward.usable_beds ?? 0}</span>
                  </div>
                  <div className="bg-[#070e1b] border border-[#1e293b] p-2 rounded">
                    <span className="text-[10px] text-slate-400 block font-medium">Turnaround</span>
                    <span className="font-mono text-sm font-bold text-amber-400">{ward.dirty}</span>
                  </div>
                  <div className="bg-[#070e1b] border border-[#1e293b] p-2 rounded">
                    <span className="text-[10px] text-slate-400 block font-medium">Isolation</span>
                    <span className="font-mono text-sm font-bold text-secondary">{ward.isolation}</span>
                  </div>
                </div>
              </div>

              {/* Badges footer */}
              <div className="flex items-center justify-between pt-2 border-t border-[#1e293b] text-xs">
                <div className="flex items-center gap-1.5">
                  {ward.has_telemetry && (
                    <span className="flex items-center gap-1 text-[10px] bg-cyan-950/70 border border-cyan-800 text-primary px-1.5 py-0.5 rounded">
                      <HeartPulse className="w-3 h-3" /> Telemetry
                    </span>
                  )}
                  {ward.has_negative_pressure && (
                    <span className="flex items-center gap-1 text-[10px] bg-teal-950/70 border border-teal-800 text-teal-300 px-1.5 py-0.5 rounded">
                      <Wind className="w-3 h-3" /> Neg Press
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-mono text-slate-500">ID: {ward.id}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
