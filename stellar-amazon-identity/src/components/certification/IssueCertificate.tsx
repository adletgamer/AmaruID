import { useState } from 'react';
import type { MemberAccount, LeaderAccount, CommunityAccount } from '@/types/account';
import { createTrustline, issueCertificate, COMMCERT_CODE } from '@/lib/stellar/assets';
import { Loader2, Award, AlertCircle, CheckCircle2 } from 'lucide-react';

interface IssueCertificateProps {
  member: MemberAccount;
  community: CommunityAccount;
  leaders: LeaderAccount[];
  onSuccess: () => void;
}

export function IssueCertificate({ member, community, leaders, onSuccess }: IssueCertificateProps) {
  const [step, setStep] = useState<'trustline' | 'issue' | 'done'>('trustline');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTrustline = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await createTrustline(member.secretKey, COMMCERT_CODE, community.publicKey);
      if (result.success) {
        setStep('issue');
      } else {
        setError(result.error || 'Error creating trustline');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleIssue = async () => {
    setLoading(true);
    setError(null);
    try {
      const leaderSecrets = leaders.map((l) => l.secretKey);
      const result = await issueCertificate(
        leaderSecrets,
        member.publicKey,
        community.publicKey
      );
      if (result.success) {
        setStep('done');
        onSuccess();
      } else {
        setError(result.error || 'Error issuing certificate');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6">
      <div className="flex items-center gap-3">
        <Award className="h-6 w-6 text-emerald-600" />
        <h3 className="text-lg font-semibold">Certificar a {member.name}</h3>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
            step === 'trustline' ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-600'
          }`}>1</div>
          <span className="text-sm">Crear trustline COMMCERT</span>
          {step !== 'trustline' && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
        </div>

        <div className="flex items-center gap-3">
          <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
            step === 'issue' ? 'bg-emerald-600 text-white' : step === 'done' ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'
          }`}>2</div>
          <span className="text-sm">Emitir certificado (multisig)</span>
          {step === 'done' && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
        </div>
      </div>

      {step === 'trustline' && (
        <button
          onClick={handleTrustline}
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Crear Trustline
        </button>
      )}

      {step === 'issue' && (
        <button
          onClick={handleIssue}
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Emitir Certificado COMMCERT
        </button>
      )}

      {step === 'done' && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm font-medium text-emerald-700">
          <CheckCircle2 className="h-5 w-5" />
          Certificado emitido exitosamente
        </div>
      )}
    </div>
  );
}
