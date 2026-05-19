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
  legal_name: string;
  stage_name: string | null;
  birth_date: string;
  email: string;
  phone: string | null;
  address: string;
  recto_id_key: string;
  verso_id_key: string;
  selfie_key: string;
  consent_recording: number;
  consent_publication: number;
  consent_adult: number;
  ip_address: string | null;
  signed_at: string;
}
