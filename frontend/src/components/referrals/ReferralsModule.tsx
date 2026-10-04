import React from 'react';
import { Referral } from '../../types/supabase';
import { Repeat, ArrowRight, Ambulance, CheckCircle, Clock } from 'lucide-react';

interface ReferralsModuleProps {
  referrals: Referral[];
  onRefresh: () => void;
  selectedFacility: string;
}

export const ReferralsModule: React.FC<ReferralsModuleProps> = ({
  referrals,
  onRefresh,
  selectedFacility,
}) => {
  const filtered = selectedFacility === 'ALL'
    ? referrals
    : referrals.filter((r) => r.origin_hospital_id === selectedFacility || r.destination_hospital_id === selectedFacility);

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto gap-6">
      <div className="flex items-center justify-between bg-[#0f172a] border border-[#1e293b] p-5 rounded-xl shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-950/70 border border-cyan-800 flex items-center justify-center text-primary">
            <Repeat className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-headline text-base font-bold text-slate-100">Inter-Facility Transfer Referrals</h2>
            <span className="text-[11px] text-slate-400">
              Coordinating Patient Mobility across AQH, KWH, and SKMC Cluster Centers
            </span>
          </div>
        </div>
        <span className="text-xs font-bold text-slate-300 bg-[#070e1b] px-3 py-1.5 rounded-lg border border-[#1e293b]">
          {filtered.length} Dispatched Referrals
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((ref) => {
          return (
            <div key={ref.referral_id} className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-5 shadow-lg flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-primary">{ref.referral_id}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/70 text-amber-300 border border-amber-800">
                  {ref.status}
                </span>
              </div>

              {/* Origin -> Destination Route */}
              <div className="flex items-center justify-between bg-[#070e1b] p-3 rounded-lg border border-[#1e293b]">
                <div className="text-center">
                  <span className="text-[10px] text-slate-400 block font-medium">Origin</span>
                  <span className="font-headline font-bold text-sm text-slate-100">{ref.origin_hospital_id}</span>
                </div>
                <div className="flex items-center gap-2 text-primary">
                  <div className="w-8 h-px bg-cyan-800"></div>
                  <Ambulance className="w-4 h-4 text-primary animate-pulse" />
                  <div className="w-8 h-px bg-cyan-800"></div>
                </div>
                <div className="text-center">
                  <span className="text-[10px] text-slate-400 block font-medium">Destination</span>
                  <span className="font-headline font-bold text-sm text-slate-100">{ref.destination_hospital_id}</span>
                </div>
              </div>

              <div className="flex flex-col gap-1 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Specialty:</span>
                  <span className="font-medium text-slate-100">{ref.specialty_required}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Mode:</span>
                  <span className="font-medium text-slate-200">{ref.transport_mode || 'Ambulance'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Linked Encounter:</span>
                  <span className="font-mono text-primary font-bold">{ref.encounter_id}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
