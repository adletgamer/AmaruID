import { useState, useCallback } from 'react';
import { db } from '@/lib/storage/schema';
import type { ReputationScore, ReputationEvent } from '@/types/reputation';
import { calculateReputationScore, REPUTATION_WEIGHTS } from '@/types/reputation';

export function useReputation() {
  const [loading, setLoading] = useState(false);

  const calculateScore = useCallback(
    async (memberId: string, memberPublicKey: string, isCertified: boolean): Promise<ReputationScore> => {
      setLoading(true);
      try {
        const verifiedActions = await db.actions
          .where('memberId')
          .equals(memberId)
          .filter((a) => a.status === 'verified')
          .count();

        const events = await db.reputationEvents
          .where('memberId')
          .equals(memberId)
          .toArray();

        const endorsements = events.filter((e) => e.type === 'endorsement_received').length;
        const activeDays = events.filter((e) => e.type === 'daily_active').length;

        const breakdown = calculateReputationScore(
          verifiedActions,
          endorsements,
          activeDays,
          isCertified
        );

        const totalScore =
          breakdown.actionsScore +
          breakdown.endorsementsScore +
          breakdown.timeScore +
          breakdown.certificationBonus;

        const score: ReputationScore = {
          memberId,
          memberPublicKey,
          totalScore,
          verifiedActions,
          endorsements,
          activeDays,
          breakdown,
          lastCalculated: new Date().toISOString(),
        };

        await db.reputationScores.put(score);
        return score;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getScore = useCallback(async (memberId: string): Promise<ReputationScore | undefined> => {
    return db.reputationScores.get(memberId);
  }, []);

  const getEvents = useCallback(async (memberId: string): Promise<ReputationEvent[]> => {
    return db.reputationEvents.where('memberId').equals(memberId).reverse().sortBy('createdAt');
  }, []);

  const addEvent = useCallback(
    async (
      memberId: string,
      type: ReputationEvent['type'],
      description: string,
      transactionHash?: string
    ) => {
      const points =
        type === 'action_verified'
          ? REPUTATION_WEIGHTS.VERIFIED_ACTION
          : type === 'endorsement_received'
            ? REPUTATION_WEIGHTS.ENDORSEMENT
            : type === 'certification'
              ? REPUTATION_WEIGHTS.CERTIFICATION_BONUS
              : REPUTATION_WEIGHTS.ACTIVE_DAY;

      const event: ReputationEvent = {
        id: crypto.randomUUID(),
        memberId,
        type,
        points,
        description,
        transactionHash,
        createdAt: new Date().toISOString(),
      };

      await db.reputationEvents.add(event);
      return event;
    },
    []
  );

  return { calculateScore, getScore, getEvents, addEvent, loading };
}
