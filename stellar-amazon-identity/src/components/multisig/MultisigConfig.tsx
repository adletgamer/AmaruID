import { useState } from 'react';
import type { CommunityAccount, LeaderAccount } from '@/types/account';
import { setupMultisig } from '@/lib/stellar/multisig';
import { Loader2, Shield, CheckCircle2, AlertCircle } from 'lucide-react';

interface MultisigConfigProps {
  community: CommunityAccount;
  communitySecretKey: string;
  leaders: LeaderAccount[];
  onSuccess: (txHash: string) => void;
}

export function MultisigConfig({ community, communitySecretKey, leaders, onSuccess }: MultisigConfigProps) {
  const [threshold, setThreshold] = useState(Math.ceil(leaders.length / 2));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSetup = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await setupMultisig({
        communitySecretKey,
        leaderPublicKeys: leaders.map((l) => l.publicKey),
        thresholdLow: 1,
        thresholdMed: threshold,
        thresholdHigh: threshold,
      });

      if (result.success && result.hash) {
        setSuccess(true);
        onSuccess(result.hash);
      } else {
        setError(result.error || 'Error configuring multisig');
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
        <Shield className="h-6 w-6 text-blue-600" />
        <h3 className="text-lg font-semibold">Configuración Multisig</h3>
      </div>

      <div className="rounded-lg bg-blue-50 p-4">
        <p className="text-sm text-blue-800">
          La cuenta de comunidad <strong>{community.name}</strong> será controlada por {leaders.length} líderes.
          Se requiere la firma de al menos <strong>{threshold}</strong> líderes para operaciones importantes.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Umbral de firmas requeridas
        </label>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={1}
            max={leaders.length}
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="flex-1 accent-emerald-600"
          />
          <span className="text-lg font-bold text-emerald-700">
            {threshold}/{leaders.length}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">Firmantes:</p>
        {leaders.map((leader) => (
          <div key={leader.id} className="flex items-center gap-2 rounded-lg bg-gray-50 p-2 text-sm">
            <Shield className="h-4 w-4 text-blue-500" />
            <span className="font-medium">{leader.name}</span>
            <span className="text-xs text-gray-400">
              {leader.publicKey.substring(0, 8)}...
            </span>
          </div>
        ))}
      </div>

      {!success ? (
        <button
          onClick={handleSetup}
          disabled={loading || leaders.length < 2}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
          Configurar Multisig
        </button>
      ) : (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm font-medium text-emerald-700">
          <CheckCircle2 className="h-5 w-5" />
          Multisig configurado exitosamente
        </div>
      )}
    </div>
  );
}
