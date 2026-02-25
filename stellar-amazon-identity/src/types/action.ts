export type ActionCategory =
  | 'reforestation'
  | 'water_monitoring'
  | 'wildlife_protection'
  | 'education'
  | 'cultural_preservation'
  | 'waste_management';

export type ActionStatus = 'pending' | 'verified' | 'rejected';

export interface ConservationAction {
  id: string;
  memberId: string;
  memberPublicKey: string;
  category: ActionCategory;
  title: string;
  description: string;
  evidenceHash?: string;
  evidenceUrl?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  status: ActionStatus;
  verifiedBy?: string;
  verifiedAt?: string;
  transactionHash?: string;
  createdAt: string;
  syncedAt?: string;
}

export interface ActionFormData {
  category: ActionCategory;
  title: string;
  description: string;
  evidenceUrl?: string;
  latitude?: number;
  longitude?: number;
}

export const ACTION_CATEGORIES: Record<ActionCategory, { labelEs: string; labelEn: string; icon: string }> = {
  reforestation: { labelEs: 'Reforestación', labelEn: 'Reforestation', icon: '🌱' },
  water_monitoring: { labelEs: 'Monitoreo de Agua', labelEn: 'Water Monitoring', icon: '💧' },
  wildlife_protection: { labelEs: 'Protección de Fauna', labelEn: 'Wildlife Protection', icon: '🦜' },
  education: { labelEs: 'Educación Ambiental', labelEn: 'Environmental Education', icon: '📚' },
  cultural_preservation: { labelEs: 'Preservación Cultural', labelEn: 'Cultural Preservation', icon: '🏛️' },
  waste_management: { labelEs: 'Gestión de Residuos', labelEn: 'Waste Management', icon: '♻️' },
};
