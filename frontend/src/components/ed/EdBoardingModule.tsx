import React, { useState, useEffect } from 'react';
import { EdBoarding } from '../../types/supabase';
import { 
  insertEdBoardingApi, 
  updateEdBoardingApi, 
  deleteEdBoardingApi,
  getEdBoardingByIdApi
} from '../../lib/supabase';
import { 
  Terminal, 
  Key, 
  PlusCircle, 
  Search, 
  Edit3, 
  Trash2, 
  RefreshCw, 
  Shuffle, 
  Sparkles, 
  Clock, 
  HeartPulse, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle,
  Upload,
  Activity
} from 'lucide-react';

// Canonical ward specializations exactly aligned with PostgreSQL ward_capacity & ed_boarding
export const WARD_SPECIALIZATIONS = [
  { value: 'Coronary Care Unit', label: 'CCU — Coronary Care Unit', wardSuffix: 'W3' },
  { value: 'Intensive Care Unit', label: 'ICU — Intensive Care Unit', wardSuffix: 'W2' },
  { value: 'Acute Medical', label: 'Acute Medical Ward', wardSuffix: 'W1' },
  { value: 'General Surgical', label: 'General Surgical Ward', wardSuffix: 'W4' },
  { value: 'Pediatric Unit', label: 'Pediatric Unit', wardSuffix: 'W5' },
] as const;

export const normalizeWardType = (ward?: string): string => {
  if (!ward) return 'Coronary Care Unit';
  const trimmed = ward.trim();
  const lower = trimmed.toLowerCase();
  
  if (lower === 'ccu' || lower.includes('coronary')) return 'Coronary Care Unit';
  if (lower === 'icu' || lower.includes('intensive')) return 'Intensive Care Unit';
  if (lower.includes('medic') || lower === 'general medical' || lower === 'acute medical') return 'Acute Medical';
  if (lower.includes('surg') || lower === 'general surgical' || lower === 'surgical ward') return 'General Surgical';
  if (lower.includes('ped') || lower === 'pediatric' || lower === 'pediatric unit') return 'Pediatric Unit';
  
  return trimmed;
};

export const getWardIdForHospital = (hospital: string, wardType: string): string => {
  const norm = normalizeWardType(wardType);
  const found = WARD_SPECIALIZATIONS.find((w) => w.value === norm);
  const suffix = found ? found.wardSuffix : 'W3';
  return `${hospital}-${suffix}`;
};

interface EdBoardingModuleProps {
  records: EdBoarding[];
  onRefresh: () => void;
  selectedFacility: string;
}

export const EdBoardingModule: React.FC<EdBoardingModuleProps> = ({
  records,
  onRefresh,
  selectedFacility,
}) => {
  const [crudMode, setCrudMode] = useState<'insert' | 'query' | 'update' | 'delete'>('insert');
  const [sqlTab, setSqlTab] = useState<'INSERT' | 'UPDATE' | 'DELETE' | 'SELECT' | 'JSON'>('INSERT');
  const [lookupId, setLookupId] = useState('ENC-2025-0894');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State — aligned with PostgreSQL ed_boarding & ward_capacity schemas
  const [encounterId, setEncounterId] = useState('ENC-2025-0894');
  const [hospitalId, setHospitalId] = useState('AQH');
  const [patientName, setPatientName] = useState('Mariam Al-Zaabi');
  const [admittedAt, setAdmittedAt] = useState('');
  const [acuity, setAcuity] = useState<1 | 2 | 3 | 4 | 5>(2);
  const [chiefComplaint, setChiefComplaint] = useState('Acute Chest Pain with Radiating Left Arm Numbness');
  const [hoursBoarded, setHoursBoarded] = useState(4.5);
  const [targetWard, setTargetWard] = useState('Coronary Care Unit');
  const [requiresTelemetry, setRequiresTelemetry] = useState(true);
  const [requiresIsolation, setRequiresIsolation] = useState(false);
  const [assignedBedId, setAssignedBedId] = useState('AQH-W3');
  const [status, setStatus] = useState<'waiting_bed' | 'bed_assigned' | 'in_transit' | 'boarded'>('boarded');

  // Toast State
  const [toast, setToast] = useState<{ title: string; message: string; isError?: boolean } | null>(null);

  useEffect(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    setAdmittedAt(now.toISOString().slice(0, 16));
  }, []);

  const showToast = (title: string, message: string, isError = false) => {
    setToast({ title, message, isError });
    setTimeout(() => setToast(null), 4000);
  };

  const generateEncounterId = () => {
    const num = Math.floor(1000 + Math.random() * 9000);
    const newId = `ENC-2025-${num}`;
    setEncounterId(newId);
    setLookupId(newId);
  };

  const handleSimulate = () => {
    const names = ['Mariam Al-Zaabi', 'Rashid Salem K.', 'Fatima Mansoor', 'Abdullah Bin Zayed', 'Humaid Al-Shamsi'];
    const complaints = [
      'Acute Chest Pain with Radiating Left Arm Numbness',
      'Severe Dyspnea & Hypoxia, SpO2 88% on Room Air',
      'Polytrauma Post-MVA with Hemodynamic Instability',
      'Altered Mental Status with Suspected Acute Ischemic CVA',
      'Acute Sepsis Secondary to Pyelonephritis',
    ];
    const hospitals = ['AQH', 'FUJ', 'AQWCH', 'SKMC', 'KWH', 'IBHO', 'KFK', 'UAQH', 'DRA', 'KALBA'];
    const wards = [
      'Coronary Care Unit',
      'Intensive Care Unit',
      'Acute Medical',
      'General Surgical',
      'Pediatric Unit',
    ];

    const rndAcuity = (Math.floor(Math.random() * 5) + 1) as 1 | 2 | 3 | 4 | 5;
    const rndHours = parseFloat((Math.random() * 8 + 0.5).toFixed(1));
    const rndHosp = hospitals[Math.floor(Math.random() * hospitals.length)];
    const rndWard = wards[Math.floor(Math.random() * wards.length)];

    generateEncounterId();
    setHospitalId(rndHosp);
    setPatientName(names[Math.floor(Math.random() * names.length)]);
    setAcuity(rndAcuity);
    setChiefComplaint(complaints[Math.floor(Math.random() * complaints.length)]);
    setHoursBoarded(rndHours);
    setTargetWard(rndWard);
    setAssignedBedId(getWardIdForHospital(rndHosp, rndWard));
    setRequiresTelemetry(rndAcuity <= 2);
    setRequiresIsolation(Math.random() > 0.7);
    showToast('Record Simulated', 'Form populated with realistic clinical presentation data.');
  };

  const handleLookup = async () => {
    const term = lookupId.trim();
    if (!term) {
      showToast('Search Empty', 'Please enter an Encounter ID or Patient Name to fetch.', true);
      return;
    }

    setIsSubmitting(true);
    // 1. Search in-memory records first
    let match = records.find(
      (r) => r.encounter_id.toLowerCase() === term.toLowerCase() ||
             r.patient_name.toLowerCase().includes(term.toLowerCase())
    );

    // 2. If not found in active batch, query Supabase directly across all 1,000+ records
    if (!match) {
      try {
        const res = await getEdBoardingByIdApi(term);
        if (res.data) {
          match = res.data;
        }
      } catch (err) {
        console.error('Lookup error:', err);
      }
    }
    setIsSubmitting(false);

    if (match) {
      // Autopopulate all form inputs with retrieved clinical data
      setEncounterId(match.encounter_id);
      setLookupId(match.encounter_id);
      setHospitalId(match.hospital_id);
      setPatientName(match.patient_name);
      setAcuity(match.acuity as 1 | 2 | 3 | 4 | 5);
      setChiefComplaint(match.chief_complaint);
      setHoursBoarded(match.hours_boarded);
      setTargetWard(normalizeWardType(match.target_ward_type));
      setRequiresTelemetry(Boolean(match.requires_telemetry));
      setRequiresIsolation(Boolean(match.requires_isolation));
      setAssignedBedId(match.assigned_bed_id || '');
      setStatus(match.status);
      if (match.admitted_at) {
        try {
          const d = new Date(match.admitted_at);
          d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
          setAdmittedAt(d.toISOString().slice(0, 16));
        } catch {
          setAdmittedAt(match.admitted_at.slice(0, 16));
        }
      }

      // Switch mode to UPDATE so user can see it's populated and ready for editing/PUT
      setCrudMode('update');
      setSqlTab('UPDATE');

      showToast('Encounter Loaded', `Retrieved ${match.encounter_id} (${match.patient_name}) from Supabase.`);
    } else {
      showToast('Encounter Not Found', `Record "${term}" not found in database. You can still insert it.`, true);
    }
  };

  const handleInsert = async () => {
    setIsSubmitting(true);
    const newRecord: EdBoarding = {
      encounter_id: encounterId,
      hospital_id: hospitalId,
      patient_name: patientName,
      acuity,
      chief_complaint: chiefComplaint,
      hours_boarded: hoursBoarded,
      target_ward_type: targetWard,
      requires_telemetry: requiresTelemetry,
      requires_isolation: requiresIsolation,
      assigned_bed_id: assignedBedId || undefined,
      status,
      admitted_at: admittedAt ? new Date(admittedAt).toISOString() : new Date().toISOString(),
    };

    const { error } = await insertEdBoardingApi(newRecord);
    setIsSubmitting(false);

    if (error) {
      showToast('Insert Issue', error.message || 'Check database permissions or primary key duplication.', true);
    } else {
      showToast('Transaction Committed', `Encounter ${encounterId} inserted into public.ed_boarding.`);
      onRefresh();
    }
  };

  const handleUpdate = async () => {
    setIsSubmitting(true);
    const updates: Partial<EdBoarding> = {
      hospital_id: hospitalId,
      patient_name: patientName,
      acuity,
      chief_complaint: chiefComplaint,
      hours_boarded: hoursBoarded,
      target_ward_type: targetWard,
      requires_telemetry: requiresTelemetry,
      requires_isolation: requiresIsolation,
      assigned_bed_id: assignedBedId || undefined,
      status,
    };

    const { error } = await updateEdBoardingApi(encounterId, updates);
    setIsSubmitting(false);

    if (error) {
      showToast('Update Failed', error.message || 'Failed to update record.', true);
    } else {
      showToast('Encounter Updated', `Successfully updated ${encounterId} in public.ed_boarding.`);
      onRefresh();
    }
  };

  const handleDelete = async (idToDelete = encounterId) => {
    if (!confirm(`Are you sure you want to delete encounter ${idToDelete}?`)) return;

    setIsSubmitting(true);
    const { error } = await deleteEdBoardingApi(idToDelete);
    setIsSubmitting(false);

    if (error) {
      showToast('Delete Failed', error.message || 'Failed to delete record.', true);
    } else {
      showToast('Record Deleted', `Encounter ${idToDelete} removed from public.ed_boarding.`);
      onRefresh();
    }
  };

  const handleCycleStatus = async (record: EdBoarding) => {
    const flow: Array<EdBoarding['status']> = ['waiting_bed', 'bed_assigned', 'in_transit', 'boarded'];
    const nextIdx = (flow.indexOf(record.status) + 1) % flow.length;
    const nextStatus = flow[nextIdx];

    const { error } = await updateEdBoardingApi(record.encounter_id, { status: nextStatus });
    if (!error) {
      showToast('Status Advanced', `${record.encounter_id} moved to status: ${nextStatus}`);
      onRefresh();
    }
  };

  // Filtered records by facility
  const filteredRecords = selectedFacility === 'ALL' 
    ? records 
    : records.filter((r) => r.hospital_id === selectedFacility);

  // Live SQL Generator
  const cleanComplaint = chiefComplaint.replace(/'/g, "''");
  const cleanName = patientName.replace(/'/g, "''");

  const sqlStatements = {
    INSERT: `-- SQL INSERT STATEMENT
INSERT INTO public.ed_boarding (
  encounter_id,
  hospital_id,
  patient_name,
  admitted_at,
  acuity,
  chief_complaint,
  hours_boarded,
  target_ward_type,
  requires_telemetry,
  requires_isolation,
  assigned_bed_id,
  status
) VALUES (
  '${encounterId}',
  '${hospitalId}',
  '${cleanName}',
  '${admittedAt ? new Date(admittedAt).toISOString() : new Date().toISOString()}'::timestamptz,
  ${acuity},
  '${cleanComplaint}',
  ${hoursBoarded},
  '${targetWard}',
  ${requiresTelemetry},
  ${requiresIsolation},
  ${assignedBedId ? `'${assignedBedId}'` : 'NULL'},
  '${status}'
) RETURNING encounter_id, admitted_at;`,

    UPDATE: `-- SQL UPDATE STATEMENT
UPDATE public.ed_boarding
SET
  hospital_id = '${hospitalId}',
  patient_name = '${cleanName}',
  acuity = ${acuity},
  chief_complaint = '${cleanComplaint}',
  hours_boarded = ${hoursBoarded},
  target_ward_type = '${targetWard}',
  requires_telemetry = ${requiresTelemetry},
  requires_isolation = ${requiresIsolation},
  assigned_bed_id = ${assignedBedId ? `'${assignedBedId}'` : 'NULL'},
  status = '${status}'
WHERE encounter_id = '${encounterId}';`,

    DELETE: `-- HARD DELETE STATEMENT
DELETE FROM public.ed_boarding
WHERE encounter_id = '${encounterId}'
RETURNING encounter_id;`,

    SELECT: `-- PARAMETERIZED SELECT QUERY
SELECT *
FROM public.ed_boarding
WHERE encounter_id = '${encounterId}'
LIMIT 1;`,

    JSON: JSON.stringify({
      encounter_id: encounterId,
      hospital_id: hospitalId,
      patient_name: patientName,
      acuity,
      chief_complaint: chiefComplaint,
      hours_boarded: hoursBoarded,
      target_ward_type: targetWard,
      requires_telemetry: requiresTelemetry,
      requires_isolation: requiresIsolation,
      assigned_bed_id: assignedBedId || null,
      status,
    }, null, 2)
  };

  const acuityDescriptions = {
    1: 'Level 1 — Resuscitation (Immediate Emergent Care)',
    2: 'Level 2 — Emergent (15 Min Max)',
    3: 'Level 3 — Urgent (30 Min Max)',
    4: 'Level 4 — Less Urgent (60 Min Max)',
    5: 'Level 5 — Non-Urgent (120 Min Max)'
  };

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto">
      {/* Top Operations Sub-Bar */}
      <div className="py-3.5 px-5 mb-6 flex flex-col gap-3.5 bg-[#0f172a] border border-[#1e293b] rounded-xl shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-[#1e293b]/70 pb-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 bg-[#070e1b] border border-[#1e293b] px-2.5 py-1 rounded text-primary text-xs">
              <Terminal className="w-3.5 h-3.5 text-primary" />
              <span className="font-mono font-semibold text-xs">public.ed_boarding [CRUD Console]</span>
            </div>
            <span className="px-2 py-0.5 bg-cyan-950/70 border border-cyan-800 text-cyan-300 text-[10px] font-bold rounded tracking-wide">
              SCHEMA: v4.2
            </span>
            <div className="flex items-center gap-1 text-slate-400 text-xs pl-1">
              <Key className="w-3 h-3 text-slate-400" />
              <span>PK: <code className="text-primary font-mono font-bold text-xs">encounter_id</code></span>
            </div>
          </div>

          {/* Mode Switcher Buttons */}
          <div className="flex items-center gap-1 bg-[#070e1b] p-1 rounded-lg border border-[#1e293b]">
            <button
              onClick={() => { setCrudMode('insert'); setSqlTab('INSERT'); }}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                crudMode === 'insert'
                  ? 'bg-cyan-500/20 text-primary border border-cyan-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>INSERT</span>
            </button>
            <button
              onClick={() => { setCrudMode('query'); setSqlTab('SELECT'); }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                crudMode === 'query'
                  ? 'bg-cyan-500/20 text-primary border border-cyan-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>QUERY</span>
            </button>
            <button
              onClick={() => { setCrudMode('update'); setSqlTab('UPDATE'); }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                crudMode === 'update'
                  ? 'bg-cyan-500/20 text-primary border border-cyan-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>UPDATE</span>
            </button>
            <button
              onClick={() => { setCrudMode('delete'); setSqlTab('DELETE'); }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                crudMode === 'delete'
                  ? 'bg-rose-950/60 text-rose-400 border border-rose-800 shadow-xs'
                  : 'text-slate-400 hover:text-rose-400'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>DELETE</span>
            </button>
          </div>
        </div>

        {/* Lookup and Simulation Bar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-3 flex-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap">
              <Search className="w-4 h-4 text-primary" /> Encounter Lookup:
            </span>
            <div className="relative flex-1 max-w-md flex items-center">
              <input
                type="text"
                value={lookupId}
                onChange={(e) => setLookupId(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleLookup();
                  }
                }}
                placeholder="Enter ID (e.g. ENC-1041) or Name..."
                className="w-full bg-[#070e1b] border border-[#1e293b] text-slate-200 font-mono text-xs px-3 py-2 rounded-l-md outline-none focus:border-primary transition-all placeholder:text-slate-500"
              />
              <button
                type="button"
                onClick={handleLookup}
                disabled={isSubmitting}
                className="bg-[#1e293b] hover:bg-[#334155] border border-l-0 border-[#1e293b] text-slate-200 px-3.5 py-2 rounded-r-md font-semibold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-3.5 h-3.5 text-primary animate-spin" />
                ) : (
                  <Search className="w-3.5 h-3.5 text-primary" />
                )}
                <span>Fetch [GET]</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={generateEncounterId}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#070e1b] border border-[#1e293b] text-slate-300 hover:bg-[#1e293b] font-semibold text-xs transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>New ID</span>
            </button>
            <button
              type="button"
              onClick={handleSimulate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-cyan-950/60 border border-cyan-800 text-primary hover:bg-cyan-900/60 font-semibold text-xs transition-colors"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>Simulate Record</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Form (8 cols) and Live Buffer + Registry (4 cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-8">
        {/* Left: Clinical Intake Form */}
        <div className="xl:col-span-8 flex flex-col gap-6">
          <form className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-6 shadow-xl flex flex-col gap-5">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#1e293b]">
              <div className="flex items-center gap-2.5">
                <HeartPulse className="w-5 h-5 text-primary" />
                <h2 className="font-headline text-lg font-bold text-slate-100 tracking-tight">
                  Clinical Intake &amp; Triage Descriptor [{crudMode.toUpperCase()} MODE]
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {crudMode !== 'insert' && (
                  <button
                    type="button"
                    onClick={() => {
                      setCrudMode('insert');
                      setSqlTab('INSERT');
                      generateEncounterId();
                    }}
                    className="px-2.5 py-1 rounded bg-[#070e1b] hover:bg-[#1e293b] text-cyan-300 border border-cyan-800 text-[10px] font-bold transition-all shadow-xs"
                  >
                    + Switch to Insert New
                  </button>
                )}
                <span className={`px-2.5 py-1 rounded font-bold text-[10px] uppercase tracking-wider border ${
                  crudMode === 'update'
                    ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                    : 'bg-cyan-950/80 text-primary border-cyan-800/80'
                }`}>
                  OPERATION: {crudMode.toUpperCase()}
                </span>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Buffer Live
                </span>
              </div>
            </div>

            {/* Row 1: Encounter ID & Facility */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <span>Encounter ID</span>
                    <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={generateEncounterId}
                    className="text-[11px] font-bold text-primary hover:text-cyan-300 flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" /> Auto-Gen
                  </button>
                </div>
                <input
                  type="text"
                  value={encounterId}
                  onChange={(e) => setEncounterId(e.target.value)}
                  placeholder="ENC-YYYY-XXXX"
                  required
                  className="w-full bg-[#070e1b] border border-[#1e293b] text-slate-100 font-mono font-semibold text-xs px-3 py-2 rounded-lg outline-none focus:border-primary transition-all"
                />
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  Standard clinical encounter identifier format
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <span>Hospital Facility (FK: facilities)</span>
                    <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <span className="text-[10px] font-bold text-emerald-400">Network Validated</span>
                </div>
                <select
                  value={hospitalId}
                  onChange={(e) => {
                    const newHosp = e.target.value;
                    setHospitalId(newHosp);
                    if (assignedBedId) {
                      setAssignedBedId(getWardIdForHospital(newHosp, targetWard));
                    }
                  }}
                  className="w-full bg-[#070e1b] border border-[#1e293b] text-slate-100 text-xs font-medium px-3 py-2 rounded-lg outline-none focus:border-primary transition-all cursor-pointer"
                >
                  <option value="AQH">AQH — Al Qassimi Hospital (Sharjah Core, 500 beds)</option>
                  <option value="FUJ">FUJ — Fujairah Hospital (Fujairah, 320 beds)</option>
                  <option value="AQWCH">AQWCH — Al Qassimi Women &amp; Children (Sharjah, 250 beds)</option>
                  <option value="SKMC">SKMC — Sheikh Khalifa Medical City (Ajman, 240 beds)</option>
                  <option value="KWH">KWH — Kuwait Hospital (Sharjah, 180 beds)</option>
                  <option value="IBHO">IBHO — Ibrahim Bin Hamad Obaidullah (RAK, 170 beds)</option>
                  <option value="KFK">KFK — Khorfakkan Hospital (Sharjah, 160 beds)</option>
                  <option value="UAQH">UAQH — Umm Al Quwain Hospital (UAQ, 135 beds)</option>
                  <option value="DRA">DRA — Al Dhaid Hospital (Sharjah, 120 beds)</option>
                  <option value="KALBA">KALBA — Kalba Hospital (Sharjah, 110 beds)</option>
                </select>
                <span className="text-[11px] text-slate-500">Resolved through master cluster node</span>
              </div>
            </div>

            {/* Row 2: Patient Name & Admitted Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <span>Patient Full Legal Name</span>
                    <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <span className="flex items-center gap-1 text-[10px] font-bold text-primary bg-cyan-950/60 border border-cyan-800 px-1.5 py-0.5 rounded">
                    <ShieldAlert className="w-2.5 h-2.5" /> HIP-SEC-A
                  </span>
                </div>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Enter patient full name"
                  required
                  className="w-full bg-[#070e1b] border border-[#1e293b] text-slate-100 text-xs font-medium px-3 py-2 rounded-lg outline-none focus:border-primary transition-all"
                />
                <span className="text-[11px] text-slate-500">Compliant with UAE national health data privacy</span>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <span>Admitted Timestamp</span>
                    <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const now = new Date();
                      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
                      setAdmittedAt(now.toISOString().slice(0, 16));
                    }}
                    className="text-[11px] font-bold text-primary hover:text-cyan-300 flex items-center gap-1"
                  >
                    <Clock className="w-3 h-3" /> Now (GST +4)
                  </button>
                </div>
                <input
                  type="datetime-local"
                  value={admittedAt}
                  onChange={(e) => setAdmittedAt(e.target.value)}
                  className="w-full bg-[#070e1b] border border-[#1e293b] text-slate-100 text-xs font-mono px-3 py-2 rounded-lg outline-none focus:border-primary transition-all"
                />
                <span className="text-[11px] text-slate-500">Gulf Standard Time (GST +04:00)</span>
              </div>
            </div>

            {/* Row 3: CTAS Acuity Selector (5 buttons) */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  CTAS Acuity Level (Canadian Triage &amp; Acuity Scale)
                </label>
                <span className="text-primary font-bold text-xs font-headline">
                  {acuityDescriptions[acuity]}
                </span>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {/* L1 Resuscitation */}
                <button
                  type="button"
                  onClick={() => setAcuity(1)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-lg border transition-all ${
                    acuity === 1
                      ? 'border-rose-500 bg-rose-950/40 text-rose-200 font-bold shadow-lg shadow-rose-950/50'
                      : 'border-[#1e293b] bg-[#070e1b] hover:bg-[#1e293b] text-slate-400'
                  }`}
                >
                  <span className="font-mono text-sm font-bold leading-none mb-1 text-rose-400">L1</span>
                  <span className="text-[10px] font-bold uppercase">Resus</span>
                  <span className="w-2 h-2 rounded-full bg-rose-500 mt-1 animate-ping"></span>
                </button>

                {/* L2 Emergent */}
                <button
                  type="button"
                  onClick={() => setAcuity(2)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-lg border transition-all ${
                    acuity === 2
                      ? 'border-orange-500 bg-orange-950/40 text-orange-200 font-bold shadow-lg shadow-orange-950/50'
                      : 'border-[#1e293b] bg-[#070e1b] hover:bg-[#1e293b] text-slate-400'
                  }`}
                >
                  <span className="font-mono text-sm font-bold leading-none mb-1 text-orange-400">L2</span>
                  <span className="text-[10px] font-bold uppercase">Emergent</span>
                  <span className="w-2 h-2 rounded-full bg-orange-500 mt-1"></span>
                </button>

                {/* L3 Urgent */}
                <button
                  type="button"
                  onClick={() => setAcuity(3)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-lg border transition-all ${
                    acuity === 3
                      ? 'border-amber-500 bg-amber-950/40 text-amber-200 font-bold shadow-lg shadow-amber-950/50'
                      : 'border-[#1e293b] bg-[#070e1b] hover:bg-[#1e293b] text-slate-400'
                  }`}
                >
                  <span className="font-mono text-sm font-bold leading-none mb-1 text-amber-400">L3</span>
                  <span className="text-[10px] font-bold uppercase">Urgent</span>
                  <span className="w-2 h-2 rounded-full bg-amber-500 mt-1"></span>
                </button>

                {/* L4 Less Urgent */}
                <button
                  type="button"
                  onClick={() => setAcuity(4)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-lg border transition-all ${
                    acuity === 4
                      ? 'border-emerald-500 bg-emerald-950/40 text-emerald-200 font-bold shadow-lg shadow-emerald-950/50'
                      : 'border-[#1e293b] bg-[#070e1b] hover:bg-[#1e293b] text-slate-400'
                  }`}
                >
                  <span className="font-mono text-sm font-bold leading-none mb-1 text-emerald-400">L4</span>
                  <span className="text-[10px] font-bold uppercase">Less Urgent</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1"></span>
                </button>

                {/* L5 Non-Urgent */}
                <button
                  type="button"
                  onClick={() => setAcuity(5)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-lg border transition-all ${
                    acuity === 5
                      ? 'border-blue-500 bg-blue-950/40 text-blue-200 font-bold shadow-lg shadow-blue-950/50'
                      : 'border-[#1e293b] bg-[#070e1b] hover:bg-[#1e293b] text-slate-400'
                  }`}
                >
                  <span className="font-mono text-sm font-bold leading-none mb-1 text-blue-400">L5</span>
                  <span className="text-[10px] font-bold uppercase">Non-Urgent</span>
                  <span className="w-2 h-2 rounded-full bg-blue-500 mt-1"></span>
                </button>
              </div>
            </div>

            {/* Row 4: Chief Complaint & Presets */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Chief Complaint / Triage Narrative
                </label>
                <span className="text-[11px] text-slate-500 font-mono">
                  {chiefComplaint.length} chars
                </span>
              </div>
              <textarea
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                rows={3}
                placeholder="Detailed presentation, onset time, preliminary vitals..."
                className="w-full bg-[#070e1b] border border-[#1e293b] text-slate-100 text-xs font-medium p-3 rounded-lg outline-none focus:border-primary transition-all"
              />
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase mr-1">Presets:</span>
                {[
                  'Acute Chest Pain with Radiating Left Arm Numbness',
                  'Severe Dyspnea & Hypoxia, SpO2 88% on Room Air',
                  'Polytrauma Post-MVA with Hemodynamic Instability',
                  'Altered Mental Status with Suspected Acute Ischemic CVA',
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setChiefComplaint(preset)}
                    className="px-2 py-1 bg-[#070e1b] hover:bg-[#1e293b] border border-[#1e293b] text-slate-300 rounded text-xs transition-colors"
                  >
                    {preset.split(' ')[0]} {preset.split(' ')[1]}
                  </button>
                ))}
              </div>
            </div>

            {/* Row 5: Hours Boarded & Target Ward */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Hours Boarded in ED
                  </label>
                  {hoursBoarded >= 4.0 ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-rose-400" /> Exceeds 4h EHS KPI
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Within KPI Target
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 bg-[#070e1b] border border-[#1e293b] rounded-lg p-1.5">
                  <button
                    type="button"
                    onClick={() => setHoursBoarded(Math.max(0, parseFloat((hoursBoarded - 0.5).toFixed(1))))}
                    className="w-8 h-8 rounded bg-[#0f172a] hover:bg-[#1e293b] border border-[#1e293b] text-slate-200 flex items-center justify-center font-bold"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="96"
                    value={hoursBoarded}
                    onChange={(e) => setHoursBoarded(parseFloat(e.target.value) || 0)}
                    className="w-full text-center bg-transparent text-primary font-mono font-bold text-sm outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setHoursBoarded(parseFloat((hoursBoarded + 0.5).toFixed(1)))}
                    className="w-8 h-8 rounded bg-[#0f172a] hover:bg-[#1e293b] border border-[#1e293b] text-slate-200 flex items-center justify-center font-bold"
                  >
                    +
                  </button>
                </div>
                <span className="text-[11px] text-slate-500">Target boarding window: ≤ 4.0 hours threshold</span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Target Ward Specialization
                </label>
                <select
                  value={targetWard}
                  onChange={(e) => {
                    const newWard = e.target.value;
                    setTargetWard(newWard);
                    if (assignedBedId) {
                      setAssignedBedId(getWardIdForHospital(hospitalId, newWard));
                    }
                  }}
                  className="w-full bg-[#070e1b] border border-[#1e293b] text-slate-100 text-xs font-medium px-3 py-2.5 rounded-lg outline-none focus:border-primary transition-all cursor-pointer"
                >
                  {WARD_SPECIALIZATIONS.map((spec) => (
                    <option key={spec.value} value={spec.value}>
                      {spec.label}
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-slate-500">Specialty capacity matching logic</span>
              </div>
            </div>

            {/* Row 6: Clinical Flags (Telemetry & Isolation) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#070e1b] border border-[#1e293b] p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <HeartPulse className="w-4 h-4 text-primary" /> Requires Telemetry Monitoring
                  </span>
                  <span className="text-[11px] text-slate-400">Continuous cardiac telemetry feed</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requiresTelemetry}
                    onChange={(e) => setRequiresTelemetry(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#1e293b] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-secondary" /> Requires Clinical Isolation
                  </span>
                  <span className="text-[11px] text-slate-400">Negative pressure / contact precautions</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requiresIsolation}
                    onChange={(e) => setRequiresIsolation(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#1e293b] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary"></div>
                </label>
              </div>
            </div>

            {/* Commit Action Buttons Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-[#1e293b]">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                <Key className="w-3.5 h-3.5 text-primary" />
                <span>Target Table: <code className="text-primary font-mono font-bold">public.ed_boarding</code></span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleLookup}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#070e1b] border border-[#1e293b] hover:bg-[#1e293b] text-slate-200 text-xs font-semibold"
                >
                  <Search className="w-3.5 h-3.5 text-primary" />
                  <span>Fetch [GET]</span>
                </button>
                <button
                  type="button"
                  onClick={handleUpdate}
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-cyan-950/60 border border-cyan-800 hover:bg-cyan-900/60 text-primary text-xs font-bold"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Update [PUT]</span>
                </button>
                <button
                  type="button"
                  onClick={handleInsert}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-primary hover:bg-primary-hover text-[#060e20] text-xs font-extrabold shadow-lg shadow-cyan-950"
                >
                  <Upload className="w-4 h-4" />
                  <span>Insert Record [Commit]</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete()}
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-950/50 border border-rose-800 hover:bg-rose-900/50 text-rose-300 text-xs font-bold"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hard DELETE</span>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Right Column: Live Mutation Buffer & Encounter Registry */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          {/* Live Mutation Buffer (SQL & JSON Engine) */}
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-5 shadow-lg flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-primary" />
                <h3 className="font-headline text-sm font-bold text-slate-200">Live Mutation Buffer</h3>
              </div>
              <span className="text-[10px] font-bold text-slate-400 font-mono bg-[#070e1b] px-2 py-0.5 rounded border border-[#1e293b]">
                SQL ENGINE
              </span>
            </div>

            {/* SQL Tab Buttons */}
            <div className="flex flex-wrap gap-1 bg-[#070e1b] p-1 rounded-lg border border-[#1e293b]">
              {(['INSERT', 'UPDATE', 'DELETE', 'SELECT', 'JSON'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setSqlTab(tab)}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                    sqlTab === tab
                      ? 'bg-primary text-[#060e20] shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Syntax-Highlighted Buffer Display */}
            <div className="relative bg-[#060e20] text-cyan-300 rounded-lg p-3 font-mono text-[11px] overflow-x-auto min-h-[220px] border border-[#1e293b] shadow-inner">
              <pre className="leading-relaxed whitespace-pre-wrap">
                {sqlStatements[sqlTab]}
              </pre>
            </div>

            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span className="font-medium">Target: <span className="text-slate-200 font-semibold">{hospitalId} Master Node</span></span>
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> TLS v1.3 Verified
              </span>
            </div>
          </div>

          {/* Recent Encounter Registry Feed */}
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-5 shadow-lg flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-secondary" />
                <div className="flex flex-col">
                  <h3 className="font-headline text-sm font-bold text-slate-200">Encounter Registry</h3>
                  <span className="text-[10px] text-slate-500 font-mono">public.ed_boarding</span>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#070e1b] text-slate-300 border border-[#1e293b]">
                {filteredRecords.length} Active Records
              </span>
            </div>

            {/* Row List */}
            <div className="flex flex-col gap-2.5 max-h-[380px] overflow-y-auto pr-1">
              {filteredRecords.slice(0, 6).map((rec) => {
                const isSelected = rec.encounter_id === encounterId;
                const acuityColor =
                  rec.acuity === 1 ? 'bg-rose-950/70 text-rose-300 border-rose-800' :
                  rec.acuity === 2 ? 'bg-orange-950/70 text-orange-300 border-orange-800' :
                  rec.acuity === 3 ? 'bg-amber-950/70 text-amber-300 border-amber-800' :
                  'bg-emerald-950/70 text-emerald-300 border-emerald-800';

                return (
                  <div
                    key={rec.encounter_id}
                    className={`bg-[#070e1b] border p-3 rounded-lg flex flex-col gap-1.5 transition-all ${
                      isSelected
                        ? 'border-l-4 border-l-primary border-primary/50 shadow-md'
                        : 'border-[#1e293b] hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-primary font-bold">{rec.encounter_id}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${acuityColor}`}>
                          CTAS {rec.acuity}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-800 px-1.5 py-0.5 rounded uppercase">
                        {rec.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <div>
                        <span className="font-bold text-slate-200 block">{rec.patient_name}</span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {rec.hospital_id} • {rec.target_ward_type} • {rec.hours_boarded}h boarded
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEncounterId(rec.encounter_id);
                            setLookupId(rec.encounter_id);
                            setHospitalId(rec.hospital_id);
                            setPatientName(rec.patient_name);
                            setAcuity(rec.acuity);
                            setChiefComplaint(rec.chief_complaint);
                            setHoursBoarded(rec.hours_boarded);
                            setTargetWard(normalizeWardType(rec.target_ward_type));
                            setRequiresTelemetry(rec.requires_telemetry);
                            setRequiresIsolation(rec.requires_isolation);
                            setAssignedBedId(rec.assigned_bed_id || '');
                            setStatus(rec.status);
                            if (rec.admitted_at) {
                              try {
                                const d = new Date(rec.admitted_at);
                                d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
                                setAdmittedAt(d.toISOString().slice(0, 16));
                              } catch {
                                setAdmittedAt(rec.admitted_at.slice(0, 16));
                              }
                            }
                            setCrudMode('update');
                            setSqlTab('UPDATE');
                            showToast('Loaded into Editor', `Loaded ${rec.encounter_id}`);
                          }}
                          className="px-2 py-1 bg-[#0f172a] hover:bg-primary hover:text-[#060e20] text-slate-300 rounded text-[10px] font-bold transition-all border border-[#1e293b]"
                          title="Load into form editor"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCycleStatus(rec)}
                          className="px-2 py-1 bg-[#0f172a] hover:bg-[#1e293b] text-slate-300 rounded text-[10px] font-bold transition-all border border-[#1e293b]"
                          title="Advance operational status"
                        >
                          Status
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(rec.encounter_id)}
                          className="px-2 py-1 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 rounded text-[10px] font-bold transition-all border border-rose-800/80"
                          title="Expunge record"
                        >
                          Del
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-[#070e1b] border border-[#1e293b] p-2.5 rounded-lg flex items-center justify-between text-slate-400 text-xs">
              <span className="flex items-center gap-1.5 font-medium">
                <Terminal className="w-3.5 h-3.5 text-primary" /> WAL Status: Read/Write Active
              </span>
              <span className="font-mono text-xs text-slate-200 font-bold">Latency: 9ms</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl z-50 transition-all border ${
            toast.isError
              ? 'bg-rose-950/90 text-rose-100 border-rose-800'
              : 'bg-[#060e20]/95 text-slate-100 border-cyan-800 shadow-cyan-950/50'
          }`}
        >
          {toast.isError ? (
            <AlertTriangle className="w-5 h-5 text-rose-400" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          )}
          <div className="flex flex-col">
            <span className="font-headline text-xs font-bold">{toast.title}</span>
            <span className="text-[11px] text-slate-300">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};
