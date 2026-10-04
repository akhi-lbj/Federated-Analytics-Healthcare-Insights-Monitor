export interface Facility {
  id: string;
  hospital_name: string;
  hospital_name_ar?: string;
  network?: string;
  emirate: string;
  total_licensed_beds: number;
  trauma_level?: 'Level 1' | 'Level 2' | 'Level 3' | 'Non-Trauma';
  distance_km_from_aqh?: number;
  transfer_center_contact?: string;
}

export interface WardCapacity {
  id: string;
  hospital_id: string;
  ward_name: string;
  total_beds: number;
  occupied: number;
  dirty: number;
  unstaffed: number;
  isolation: number;
  has_telemetry: boolean;
  has_negative_pressure: boolean;
  usable_beds?: number;
  last_updated?: string;
}

export interface EdBoarding {
  encounter_id: string;
  hospital_id: string;
  patient_name: string;
  acuity: 1 | 2 | 3 | 4 | 5;
  chief_complaint: string;
  hours_boarded: number;
  target_ward_type: string;
  requires_telemetry: boolean;
  requires_isolation: boolean;
  assigned_bed_id?: string;
  status: 'waiting_bed' | 'bed_assigned' | 'in_transit' | 'boarded';
  admitted_at: string;
}

export interface DischargeCase {
  patient_id: string;
  hospital_id: string;
  ward_id: string;
  patient_name: string;
  diagnosis: string;
  drg_code?: string;
  actual_los: number;
  drg_target_los: number;
  clinically_ready: boolean;
  status: string;
  blockers?: string[];
  discharged_by?: string;
  discharged_at?: string;
  updated_at?: string;
}

export interface Referral {
  referral_id: string;
  origin_hospital_id: string;
  destination_hospital_id: string;
  encounter_id: string;
  specialty_required: string;
  transport_mode?: string;
  status: 'Proposed' | 'Accepted' | 'In Transit' | 'Completed' | 'Declined';
  approved_by?: string;
  created_at?: string;
}
