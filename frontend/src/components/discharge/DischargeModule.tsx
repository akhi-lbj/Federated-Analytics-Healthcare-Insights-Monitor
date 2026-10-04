import React from 'react';
import { DischargeCase } from '../../types/supabase';
import { LogOut, Clock, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

interface DischargeModuleProps {
  cases: DischargeCase[];
  onRefresh: () => void;
  selectedFacility: string;
}

export const DischargeModule: React.FC<DischargeModuleProps> = ({
  cases,
  onRefresh,
  selectedFacility,
}) => {
  const filtered = selectedFacility === 'ALL'
    ? cases
    : cases.filter((c) => c.hospital_id === selectedFacility);

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto gap-6">
      <div className="flex items-center justify-between bg-[#0f172a] border border-[#1e293b] p-5 rounded-xl shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-950/70 border border-cyan-800 flex items-center justify-center text-primary">
            <LogOut className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-headline text-base font-bold text-slate-100">Discharge Readiness Registry</h2>
            <span className="text-[11px] text-slate-400">
              Tracking Length of Stay (LOS) vs. Diagnostic Related Group (DRG) Target Benchmarks
            </span>
          </div>
        </div>
        <span className="text-xs font-bold text-slate-300 bg-[#070e1b] px-3 py-1.5 rounded-lg border border-[#1e293b]">
          {filtered.length} Monitored Inpatients
        </span>
      </div>

      <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#070e1b] border-b border-[#1e293b] text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Patient / ID</th>
                <th className="py-3 px-4">Facility &amp; Ward</th>
                <th className="py-3 px-4">Primary Diagnosis</th>
                <th className="py-3 px-4">Actual vs DRG Target LOS</th>
                <th className="py-3 px-4">Readiness Status</th>
                <th className="py-3 px-4">Active Blockers</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]/70">
              {filtered.map((item) => {
                const isOverstay = item.actual_los > item.drg_target_los;

                return (
                  <tr key={item.patient_id} className="hover:bg-[#131b2e] transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-100 block">{item.patient_name}</span>
                      <span className="font-mono text-[10px] text-primary">{item.patient_id}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-slate-200 font-semibold">{item.hospital_id}</span>
                      <span className="text-[11px] text-slate-400 block">{item.ward_id}</span>
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-slate-300">
                      {item.diagnosis}
                      {item.drg_code && (
                        <span className="text-[10px] text-slate-400 block font-mono">Code: {item.drg_code}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-100">{item.actual_los}d</span>
                        <span className="text-slate-500">/</span>
                        <span className="font-mono text-slate-400">{item.drg_target_los}d</span>
                        {isOverstay ? (
                          <span className="text-[10px] font-bold text-rose-400 bg-rose-950/70 border border-rose-800 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <AlertTriangle className="w-2.5 h-2.5" /> +{(item.actual_los - item.drg_target_los).toFixed(1)}d
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-800 px-1.5 py-0.5 rounded">
                            On Track
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {item.clinically_ready ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950/70 text-emerald-300 border border-emerald-800 text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Discharge Ready
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-semibold">
                          <Clock className="w-3 h-3 text-amber-400" /> In Review
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {item.blockers && item.blockers.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {item.blockers.map((b, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded bg-rose-950/50 text-rose-300 border border-rose-800/80 text-[10px]">
                              {b}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-500 text-[11px]">None</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
