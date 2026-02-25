import { useAuthContext } from '@/contexts/AuthContext';
import { useAppTranslation } from '@/hooks/useTranslation';
import { MultisigConfig } from '@/components/multisig/MultisigConfig';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { db } from '@/lib/storage/schema';

interface Step2Props {
  onNext: () => void;
  onBack: () => void;
}

export function Step2Multisig({ onNext, onBack }: Step2Props) {
  const { t } = useAppTranslation();
  const { community, leaders } = useAuthContext();
  const [done, setDone] = useState(false);

  if (!community) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-700">
        <AlertCircle className="h-4 w-4" />
        No se encontró la cuenta de comunidad. Vuelve al paso anterior.
      </div>
    );
  }

  // We need the community secret key. In a real app we'd derive this differently.
  // For the demo, we'll store it temporarily via the setup flow.
  // The community secret is stored in localStorage during setup only.
  const communitySecretKey = localStorage.getItem(`amaruid:secret:${community.publicKey}`) || '';

  const handleSuccess = async (txHash: string) => {
    await db.communities.update(community.id, {
      signers: leaders.map((l) => l.publicKey),
      thresholdMed: Math.ceil(leaders.length / 2),
      thresholdHigh: Math.ceil(leaders.length / 2),
    });
    setDone(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">{t('setup.step2_title')}</h2>
        <p className="mt-1 text-sm text-gray-600">{t('setup.step2_desc')}</p>
      </div>

      {!communitySecretKey && (
        <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-medium">Nota:</p>
          <p>En el modo demo, la configuración multisig se simula. La clave secreta de la comunidad se genera durante el setup y se guarda temporalmente.</p>
        </div>
      )}

      <MultisigConfig
        community={community}
        communitySecretKey={communitySecretKey}
        leaders={leaders}
        onSuccess={handleSuccess}
      />

      <div className="flex justify-between pt-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('setup.prev_step')}
        </button>
        <button
          onClick={onNext}
          disabled={!done && !!communitySecretKey}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {t('setup.next_step')}
        </button>
      </div>
    </div>
  );
}
