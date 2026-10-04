import { createClient } from '@supabase/supabase-js';
import { Facility, WardCapacity, EdBoarding, DischargeCase, Referral } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://trrdapomdjhklwngvwxm.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRycmRhcG9tZGpoa2x3bmd2d3htIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0MjkyOTAsImV4cCI6MjEwNjAwNTI5MH0.kL0wSPVFvIeGeWOardrGNlRa0l07xuwL1IbbGIoWacw';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
  },
});

// Fallback initial records if remote request fails or is blocked by network
const FALLBACK_FACILITIES: Facility[] = [
  { id: 'AQH', hospital_name: 'Al Qassimi Hospital', hospital_name_ar: 'مستشفى القاسمي', network: 'EHS', emirate: 'Sharjah', total_licensed_beds: 500, trauma_level: 'Level 1', distance_km_from_aqh: 0.0, transfer_center_contact: '+971 6 538 6444' },
  { id: 'FUJ', hospital_name: 'Fujairah Hospital', hospital_name_ar: 'مستشفى الفجيرة', network: 'EHS', emirate: 'Fujairah', total_licensed_beds: 320, trauma_level: 'Level 2', distance_km_from_aqh: 96.0, transfer_center_contact: '+971 9 222 4111' },
  { id: 'AQWCH', hospital_name: 'Al Qassimi Women & Children Hospital', hospital_name_ar: 'مستشفى القاسمي للنساء والولادة والأطفال', network: 'EHS', emirate: 'Sharjah', total_licensed_beds: 250, trauma_level: 'Level 2', distance_km_from_aqh: 0.5, transfer_center_contact: '+971 6 538 5555' },
  { id: 'SKMC', hospital_name: 'Sheikh Khalifa Medical City Ajman', hospital_name_ar: 'مدينة الشيخ خليفة الطبية عجمان', network: 'EHS', emirate: 'Ajman', total_licensed_beds: 240, trauma_level: 'Level 1', distance_km_from_aqh: 14.5, transfer_center_contact: '+971 6 711 7777' },
  { id: 'KWH', hospital_name: 'Kuwait Hospital Sharjah', hospital_name_ar: 'مستشفى الكويت الشارقة', network: 'EHS', emirate: 'Sharjah', total_licensed_beds: 180, trauma_level: 'Level 2', distance_km_from_aqh: 4.8, transfer_center_contact: '+971 6 524 2111' },
  { id: 'IBHO', hospital_name: 'Ibrahim Bin Hamad Obaidullah Hospital', hospital_name_ar: 'مستشفى إبراهيم بن حمد عبيد الله', network: 'EHS', emirate: 'Ras Al Khaimah', total_licensed_beds: 170, trauma_level: 'Level 2', distance_km_from_aqh: 78.0, transfer_center_contact: '+971 7 222 2555' },
  { id: 'KFK', hospital_name: 'Khorfakkan Hospital', hospital_name_ar: 'مستشفى خورفكان', network: 'EHS', emirate: 'Sharjah', total_licensed_beds: 160, trauma_level: 'Level 2', distance_km_from_aqh: 112.0, transfer_center_contact: '+971 9 238 6999' },
  { id: 'UAQH', hospital_name: 'Umm Al Quwain Hospital', hospital_name_ar: 'مستشفى أم القيوين', network: 'EHS', emirate: 'Umm Al Quwain', total_licensed_beds: 135, trauma_level: 'Level 3', distance_km_from_aqh: 36.0, transfer_center_contact: '+971 6 765 6222' },
  { id: 'DRA', hospital_name: 'Al Dhaid Hospital', hospital_name_ar: 'مستشفى الذيد', network: 'EHS', emirate: 'Sharjah', total_licensed_beds: 120, trauma_level: 'Level 3', distance_km_from_aqh: 52.0, transfer_center_contact: '+971 6 882 2333' },
  { id: 'KALBA', hospital_name: 'Kalba Hospital', hospital_name_ar: 'مستشفى كلباء', network: 'EHS', emirate: 'Sharjah', total_licensed_beds: 110, trauma_level: 'Level 3', distance_km_from_aqh: 125.0, transfer_center_contact: '+971 9 277 7444' },
];

const FALLBACK_ED: EdBoarding[] = [
  {
    encounter_id: 'ENC-2025-0894',
    hospital_id: 'AQH',
    patient_name: 'Mariam Al-Zaabi',
    acuity: 2,
    chief_complaint: 'Acute Chest Pain with Radiating Left Arm Numbness',
    hours_boarded: 4.5,
    target_ward_type: 'CCU',
    requires_telemetry: true,
    requires_isolation: false,
    assigned_bed_id: 'AQH-CCU-B02',
    status: 'boarded',
    admitted_at: new Date(Date.now() - 4.5 * 3600000).toISOString(),
  },
  {
    encounter_id: 'ENC-2025-0893',
    hospital_id: 'AQH',
    patient_name: 'Rashid Salem K.',
    acuity: 1,
    chief_complaint: 'Severe Dyspnea & Hypoxia, SpO2 88% on Room Air',
    hours_boarded: 2.0,
    target_ward_type: 'ICU',
    requires_telemetry: true,
    requires_isolation: true,
    assigned_bed_id: 'AQH-ICU-B01',
    status: 'boarded',
    admitted_at: new Date(Date.now() - 2.0 * 3600000).toISOString(),
  },
  {
    encounter_id: 'ENC-2025-0892',
    hospital_id: 'KWH',
    patient_name: 'Fatima Mansoor',
    acuity: 3,
    chief_complaint: 'Post-Op Abdominal Pain with Low-Grade Fever',
    hours_boarded: 1.5,
    target_ward_type: 'Step-down Telemetry',
    requires_telemetry: false,
    requires_isolation: false,
    assigned_bed_id: 'KWH-CCU-B02',
    status: 'in_transit',
    admitted_at: new Date(Date.now() - 1.5 * 3600000).toISOString(),
  },
  {
    encounter_id: 'ENC-2025-0891',
    hospital_id: 'SKMC',
    patient_name: 'Abdullah Bin Zayed',
    acuity: 2,
    chief_complaint: 'Unstable Angina Pectoris with ST Elevation',
    hours_boarded: 3.8,
    target_ward_type: 'CCU',
    requires_telemetry: true,
    requires_isolation: false,
    assigned_bed_id: 'SKMC-ICU-08',
    status: 'waiting_bed',
    admitted_at: new Date(Date.now() - 3.8 * 3600000).toISOString(),
  },
];

const FALLBACK_WARDS: WardCapacity[] = [
  { id: 'AQH-CCU', hospital_id: 'AQH', ward_name: 'Coronary Care Unit (CCU)', total_beds: 24, occupied: 21, dirty: 1, unstaffed: 0, isolation: 0, has_telemetry: true, has_negative_pressure: false, usable_beds: 2, last_updated: new Date().toISOString() },
  { id: 'AQH-ICU', hospital_id: 'AQH', ward_name: 'Medical ICU', total_beds: 32, occupied: 29, dirty: 2, unstaffed: 0, isolation: 4, has_telemetry: true, has_negative_pressure: true, usable_beds: 1, last_updated: new Date().toISOString() },
  { id: 'AQH-MED', hospital_id: 'AQH', ward_name: 'General Medical Ward 3A', total_beds: 48, occupied: 41, dirty: 3, unstaffed: 1, isolation: 2, has_telemetry: true, has_negative_pressure: false, usable_beds: 3, last_updated: new Date().toISOString() },
  { id: 'KWH-CCU', hospital_id: 'KWH', ward_name: 'Cardiology Ward B', total_beds: 18, occupied: 14, dirty: 1, unstaffed: 0, isolation: 0, has_telemetry: true, has_negative_pressure: false, usable_beds: 3, last_updated: new Date().toISOString() },
  { id: 'KWH-MED', hospital_id: 'KWH', ward_name: 'General Inpatient 1', total_beds: 36, occupied: 30, dirty: 2, unstaffed: 1, isolation: 1, has_telemetry: false, has_negative_pressure: false, usable_beds: 3, last_updated: new Date().toISOString() },
  { id: 'SKMC-ICU', hospital_id: 'SKMC', ward_name: 'Surgical ICU Pavilion', total_beds: 40, occupied: 36, dirty: 2, unstaffed: 0, isolation: 6, has_telemetry: true, has_negative_pressure: true, usable_beds: 2, last_updated: new Date().toISOString() },
];

export async function fetchFacilitiesApi(): Promise<Facility[]> {
  try {
    const { data, error } = await supabase.from('facilities').select('*').order('total_licensed_beds', { ascending: false });
    if (error || !data || data.length === 0) return FALLBACK_FACILITIES;
    return data as Facility[];
  } catch {
    return FALLBACK_FACILITIES;
  }
}

export async function fetchEdBoardingApi(): Promise<EdBoarding[]> {
  try {
    const { data, error } = await supabase.from('ed_boarding').select('*').order('hours_boarded', { ascending: false }).limit(50);
    if (error || !data || data.length === 0) return FALLBACK_ED;
    return data as EdBoarding[];
  } catch {
    return FALLBACK_ED;
  }
}

export async function getEdBoardingByIdApi(lookup: string): Promise<{ data: EdBoarding | null; error: any }> {
  try {
    const term = lookup.trim();
    if (!term) return { data: null, error: 'Empty search term' };

    // 1. Direct exact match
    const res = await supabase.from('ed_boarding').select('*').ilike('encounter_id', term).maybeSingle();
    if (res.data) return { data: res.data as EdBoarding, error: null };

    // 2. Partial search by encounter_id or patient_name
    const listRes = await supabase
      .from('ed_boarding')
      .select('*')
      .or(`encounter_id.ilike.%${term}%,patient_name.ilike.%${term}%`)
      .limit(1);

    if (listRes.data && listRes.data.length > 0) {
      return { data: listRes.data[0] as EdBoarding, error: null };
    }

    return { data: null, error: res.error || null };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function insertEdBoardingApi(record: EdBoarding): Promise<{ data: EdBoarding | null; error: any }> {
  try {
    const { data, error } = await supabase.from('ed_boarding').insert([record]).select().single();
    return { data: data as EdBoarding, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function updateEdBoardingApi(encounter_id: string, updates: Partial<EdBoarding>): Promise<{ data: EdBoarding | null; error: any }> {
  try {
    const { data, error } = await supabase.from('ed_boarding').update(updates).eq('encounter_id', encounter_id).select().single();
    return { data: data as EdBoarding, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function deleteEdBoardingApi(encounter_id: string): Promise<{ error: any }> {
  try {
    const { error } = await supabase.from('ed_boarding').delete().eq('encounter_id', encounter_id);
    return { error };
  } catch (err) {
    return { error: err };
  }
}

export async function fetchWardCapacityApi(): Promise<WardCapacity[]> {
  try {
    const { data, error } = await supabase.from('ward_capacity').select('*').order('occupied', { ascending: false }).limit(50);
    if (error || !data || data.length === 0) return FALLBACK_WARDS;
    return data as WardCapacity[];
  } catch {
    return FALLBACK_WARDS;
  }
}

export async function fetchDischargeCasesApi(): Promise<DischargeCase[]> {
  try {
    const { data, error } = await supabase.from('discharge_cases').select('*').order('actual_los', { ascending: false }).limit(50);
    if (error || !data || data.length === 0) {
      return [
        { patient_id: 'PAT-8812', hospital_id: 'AQH', ward_id: 'AQH-MED', patient_name: 'Hassan Bin Ali', diagnosis: 'Community Acquired Pneumonia', drg_code: 'DRG-193', actual_los: 5.2, drg_target_los: 4.0, clinically_ready: true, status: 'Discharge Ready', blockers: ['Pharmacy Dispensing Delay'] },
        { patient_id: 'PAT-8819', hospital_id: 'AQH', ward_id: 'AQH-CCU', patient_name: 'Aisha Al-Nuaimi', diagnosis: 'Congestive Heart Failure Exacerbation', drg_code: 'DRG-291', actual_los: 6.8, drg_target_los: 5.5, clinically_ready: false, status: 'In Review', blockers: ['Echo Pending'] },
        { patient_id: 'PAT-8830', hospital_id: 'KWH', ward_id: 'KWH-MED', patient_name: 'Zayed Al-Falasi', diagnosis: 'Type 2 Diabetes Mellitus with Ketoacidosis', drg_code: 'DRG-638', actual_los: 3.1, drg_target_los: 3.5, clinically_ready: true, status: 'Discharge Ready', blockers: [] },
      ];
    }
    return data as DischargeCase[];
  } catch {
    return [];
  }
}

export async function fetchReferralsApi(): Promise<Referral[]> {
  try {
    const { data, error } = await supabase.from('referrals').select('*').order('created_at', { ascending: false }).limit(50);
    if (error || !data || data.length === 0) {
      return [
        { referral_id: 'REF-2025-014', origin_hospital_id: 'KWH', destination_hospital_id: 'AQH', encounter_id: 'ENC-2025-0892', specialty_required: 'Interventional Cardiology', transport_mode: 'Critical Care Ambulance', status: 'In Transit', approved_by: 'Dr. Tariq M.' },
        { referral_id: 'REF-2025-015', origin_hospital_id: 'AQH', destination_hospital_id: 'SKMC', encounter_id: 'ENC-2025-0893', specialty_required: 'ECMO / Advanced Critical Care', transport_mode: 'Critical Care Ambulance', status: 'Accepted', approved_by: 'Dr. Saeed K.' },
      ];
    }
    return data as Referral[];
  } catch {
    return [];
  }
}
