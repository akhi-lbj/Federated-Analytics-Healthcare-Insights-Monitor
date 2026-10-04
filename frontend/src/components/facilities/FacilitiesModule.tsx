import React from 'react';
import { Facility } from '../../types/supabase';
import { Building2, Phone, MapPin, BedDouble, Shield } from 'lucide-react';

interface FacilitiesModuleProps {
  facilities: Facility[];
  onRefresh: () => void;
}

export const FacilitiesModule: React.FC<FacilitiesModuleProps> = ({ facilities }) => {
  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto gap-6">
      <div className="flex items-center justify-between bg-[#0f172a] border border-[#1e293b] p-5 rounded-xl shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-950/70 border border-cyan-800 flex items-center justify-center text-primary">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-headline text-base font-bold text-slate-100">Hospital Facilities Master Reference</h2>
            <span className="text-[11px] text-slate-400">
              Regional Health Cluster Nodes &amp; Trauma Level Specifications
            </span>
          </div>
        </div>
        <span className="text-xs font-bold text-slate-300 bg-[#070e1b] px-3 py-1.5 rounded-lg border border-[#1e293b]">
          {facilities.length} Regional Centers
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {facilities.map((fac) => (
          <div
            key={fac.id}
            className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-5 shadow-lg flex flex-col justify-between gap-4 hover:border-slate-600 transition-all"
          >
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
                <span className="font-mono text-sm font-black text-primary bg-cyan-950/70 border border-cyan-800 px-2 py-0.5 rounded">
                  {fac.id}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950/70 text-emerald-300 border border-emerald-800">
                  {fac.network || 'EHS Network'}
                </span>
              </div>

              <div className="pt-3">
                <h3 className="font-headline text-base font-bold text-slate-100">{fac.hospital_name}</h3>
                {fac.hospital_name_ar && (
                  <span className="text-xs text-slate-400 font-medium block mt-0.5">{fac.hospital_name_ar}</span>
                )}
              </div>

              <div className="flex flex-col gap-2 mt-4 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span>Emirate: <strong className="text-slate-200">{fac.emirate}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <BedDouble className="w-3.5 h-3.5 text-slate-500" />
                  <span>Licensed Beds: <strong className="font-mono text-primary">{fac.total_licensed_beds}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-slate-500" />
                  <span>Trauma Tier: <strong className="text-amber-400">{fac.trauma_level || 'General'}</strong></span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#1e293b] flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-500" /> {fac.transfer_center_contact || 'Command Deck'}
              </span>
              <span className="font-mono font-semibold text-slate-300">{fac.distance_km_from_aqh} km from AQH</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
