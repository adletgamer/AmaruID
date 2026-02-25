export interface ReputationScore {
  memberId: string;
  memberPublicKey: string;
  totalScore: number;
  verifiedActions: number;
  endorsements: number;
  activeDays: number;
  breakdown: ReputationBreakdown;
  lastCalculated: string;
}

export interface ReputationBreakdown {
  actionsScore: number;
  endorsementsScore: number;
  timeScore: number;
  certificationBonus: number;
}

export interface ReputationEvent {
  id: string;
  memberId: string;
  type: 'action_verified' | 'endorsement_received' | 'certification' | 'daily_active';
  points: number;
  description: string;
  transactionHash?: string;
  createdAt: string;
}

// MVRS Formula: Minimum Viable Reputation Score
// Score = (VerifiedActions × 10) + (Endorsements × 5) + (ActiveDays × 1) + (CertificationBonus × 20)
export const REPUTATION_WEIGHTS = {
  VERIFIED_ACTION: 10,
  ENDORSEMENT: 5,
  ACTIVE_DAY: 1,
  CERTIFICATION_BONUS: 20,
} as const;

export function calculateReputationScore(
  verifiedActions: number,
  endorsements: number,
  activeDays: number,
  isCertified: boolean
): ReputationBreakdown {
  return {
    actionsScore: verifiedActions * REPUTATION_WEIGHTS.VERIFIED_ACTION,
    endorsementsScore: endorsements * REPUTATION_WEIGHTS.ENDORSEMENT,
    timeScore: activeDays * REPUTATION_WEIGHTS.ACTIVE_DAY,
    certificationBonus: isCertified ? REPUTATION_WEIGHTS.CERTIFICATION_BONUS : 0,
  };
}
