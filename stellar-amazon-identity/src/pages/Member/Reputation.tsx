import { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useReputation } from '@/hooks/useReputation';
import { useAppTranslation } from '@/hooks/useTranslation';
import { ReputationScoreDisplay } from '@/components/reputation/ReputationScore';
import { ReputationHistory } from '@/components/reputation/ReputationHistory';
import type { ReputationScore } from '@/types/reputation';
import type { ReputationEvent } from '@/types/reputation';
import { Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';

export function MemberReputation() {
  const { t } = useAppTranslation();
  const { currentAccount } = useAuthContext();
  const { calculateScore, getScore, getEvents } = useReputation();
  const [score, setScore] = useState<ReputationScore | null>(null);
  const [events, setEvents] = useState<ReputationEvent[]>([]);
  const [loading, setLoading] = useState(false);

  const member = currentAccount?.role === 'member' ? currentAccount : null;

  const loadReputation = useCallback(async () => {
    if (!member) return;
    setLoading(true);
    try {
      const existingScore = await getScore(member.id);
      if (existingScore) {
        setScore(existingScore);
      }
      const evts = await getEvents(member.id);
      setEvents(evts);
    } finally {
      setLoading(false);
    }
  }, [member, getScore, getEvents]);

  useEffect(() => {
    loadReputation();
  }, [loadReputation]);

  const handleRecalculate = async () => {
    if (!member) return;
    setLoading(true);
    try {
      const newScore = await calculateScore(member.id, member.publicKey, member.certified);
      setScore(newScore);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/member" className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900">{t('reputation.title')}</h1>
        </div>
        <button
          onClick={handleRecalculate}
          disabled={loading || !member}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Recalcular
        </button>
      </div>

      <div className="space-y-6">
        <ReputationScoreDisplay score={score} />
        <ReputationHistory events={events} />
      </div>
    </div>
  );
}
