export interface Shoot {
  id: string;
  title: string;
  shoot_date: string;
  photographer: string;
  location: string | null;
  notes: string | null;
  created_at: string;
  contract_count?: number;
}

export interface Contract {
  id: string;
  shoot_id: string;
  full_name: string;
  date_of_birth: string;
  email: string;
  phone: string | null;
  r2_key_id_front: string;
  r2_key_id_back: string;
  r2_key_selfie: string;
  consent_recording: number;
  consent_publication: number;
  consent_adult: number;
  ip_address: string | null;
  submitted_at: string;
}
