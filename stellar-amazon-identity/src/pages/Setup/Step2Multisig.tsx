import { useAuthContext } from '@/contexts/AuthContext';
import { useAppTranslation } from '@/hooks/useTranslation';
import { MultisigConfig } from '@/components/multisig/MultisigConfig';
import { AlertCircle, ArrowLeft, Shield, CheckCircle2, Info } from 'lucide-react';
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
        <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900">
          <Shield className="h-6 w-6 text-blue-600" />
          {t('setup.step2_title')}
        </h2>
        <p className="mt-1 text-sm text-gray-600">{t('setup.step2_desc')}</p>
      </div>

      {/* Explicación del Multisig */}
      <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-semibold text-blue-900">¿Qué es el Multisig?</h3>
            <p className="text-sm text-blue-800 mt-1">
              El <strong>multisig</strong> (multi-firma) protege la cuenta de la comunidad requiriendo 
              que múltiples líderes firmen las transacciones importantes, como emitir certificados.
            </p>
            <ul className="text-sm text-blue-700 mt-2 space-y-1">
              <li>• Los líderes se agregan como <strong>firmantes autorizados</strong></li>
              <li>• Se define un <strong>umbral</strong> (ej: 2 de 3 líderes deben firmar)</li>
              <li>• Esto previene que una sola persona actúe sin consenso</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Estado actual */}
      <div className="rounded-lg bg-gray-50 p-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Estado actual:</h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span>Comunidad: <strong>{community.name}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            {leaders.length >= 2 ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-amber-500" />
            )}
            <span>Líderes: <strong>{leaders.length}</strong> {leaders.length < 2 && '(mínimo 2 requeridos)'}</span>
          </div>
        </div>
      </div>

      {!communitySecretKey ? (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
          <p className="font-medium flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Clave secreta no encontrada
          </p>
          <p className="mt-1">
            La clave secreta de la comunidad no está disponible. Esto puede ocurrir si la comunidad 
            fue creada en otra sesión. Vuelve al paso 1 y crea una nueva comunidad.
          </p>
        </div>
      ) : (
        <MultisigConfig
          community={community}
          communitySecretKey={communitySecretKey}
          leaders={leaders}
          onSuccess={handleSuccess}
        />
      )}

      {done && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4">
          <div className="flex items-center gap-2 text-emerald-700">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-semibold">¡Multisig configurado exitosamente!</span>
          </div>
          <p className="text-sm text-emerald-600 mt-1">
            Ahora los líderes pueden firmar transacciones en nombre de la comunidad.
          </p>
        </div>
      )}

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
