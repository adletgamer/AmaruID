import { useState } from 'react';
import { useAppTranslation } from '@/hooks/useTranslation';
import { useAccounts } from '@/hooks/useAccounts';
import { useOfflineStorage } from '@/hooks/useOfflineStorage';
import { useReputation } from '@/hooks/useReputation';
import { AccountCard } from '@/components/accounts/AccountCard';
import { CertificateCard } from '@/components/certification/CertificateCard';
import { ReputationScoreDisplay } from '@/components/reputation/ReputationScore';
import { ActionCard } from '@/components/actions/ActionCard';
import { db } from '@/lib/storage/schema';
import type { ConservationAction } from '@/types/action';
import type { ReputationScore } from '@/types/reputation';
import {
  Play,
  RotateCcw,
  CheckCircle2,
  Loader2,
  ChevronRight,
  Trees,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

type DemoStep = 'idle' | 'accounts' | 'actions' | 'reputation' | 'complete';

export function DemoPage() {
  const { t } = useAppTranslation();
  const { createCommunity, createLeader, createMember, community, leaders, members } = useAccounts();
  const { saveAction } = useOfflineStorage();
  const { calculateScore, addEvent } = useReputation();
  const [step, setStep] = useState<DemoStep>('idle');
  const [loading, setLoading] = useState(false);
  const [demoActions, setDemoActions] = useState<ConservationAction[]>([]);
  const [demoScore, setDemoScore] = useState<ReputationScore | null>(null);

  const runAccountsDemo = async () => {
    setLoading(true);
    setStep('accounts');
    try {
      if (!community) {
        await createCommunity('Comunidad Río Napo', 'Comunidad indígena protectora de la cuenca del Río Napo');
      }
      const currentCommunity = community || (await db.communities.toArray())[0];
      if (currentCommunity && leaders.length < 2) {
        await createLeader('María Huanca', currentCommunity.id);
        await createLeader('Carlos Quispe', currentCommunity.id);
      }
      if (currentCommunity && members.length < 1) {
        await createMember('Ana Tupac', currentCommunity.id);
      }
    } finally {
      setLoading(false);
    }
  };

  const runActionsDemo = async () => {
    setLoading(true);
    setStep('actions');
    try {
      const member = members[0] || (await db.members.toArray())[0];
      if (!member) return;

      const demoActionData: Partial<ConservationAction>[] = [
        {
          category: 'reforestation',
          title: 'Plantación de 100 árboles nativos',
          description: 'Reforestación en zona degradada junto al río con especies como shihuahuaco y caoba',
          status: 'verified',
        },
        {
          category: 'water_monitoring',
          title: 'Monitoreo calidad de agua - Río Napo',
          description: 'Medición de pH, turbidez y contaminantes en 5 puntos del río',
          status: 'verified',
        },
        {
          category: 'wildlife_protection',
          title: 'Patrullaje anti-caza furtiva',
          description: 'Patrullaje de 3 días protegiendo zona de anidación de guacamayos',
          status: 'pending',
        },
      ];

      const createdActions: ConservationAction[] = [];
      for (const data of demoActionData) {
        const action: ConservationAction = {
          id: crypto.randomUUID(),
          memberId: member.id,
          memberPublicKey: member.publicKey,
          category: data.category!,
          title: data.title!,
          description: data.description!,
          status: data.status as ConservationAction['status'],
          createdAt: new Date().toISOString(),
        };
        await saveAction(action);
        createdActions.push(action);

        if (data.status === 'verified') {
          await addEvent(member.id, 'action_verified', `Acción verificada: ${data.title}`);
        }
      }
      setDemoActions(createdActions);
    } finally {
      setLoading(false);
    }
  };

  const runReputationDemo = async () => {
    setLoading(true);
    setStep('reputation');
    try {
      const member = members[0] || (await db.members.toArray())[0];
      if (!member) return;

      await addEvent(member.id, 'daily_active', 'Día activo en la plataforma');
      const score = await calculateScore(member.id, member.publicKey, false);
      setDemoScore(score);
      setStep('complete');
    } finally {
      setLoading(false);
    }
  };

  const resetDemo = async () => {
    await db.delete();
    await db.open();
    setStep('idle');
    setDemoActions([]);
    setDemoScore(null);
    window.location.reload();
  };

  const steps = [
    { id: 'accounts', label: 'Crear Cuentas', desc: 'Comunidad + Líderes + Miembros' },
    { id: 'actions', label: 'Registrar Acciones', desc: 'Acciones de conservación' },
    { id: 'reputation', label: 'Calcular Reputación', desc: 'MVRS Score' },
  ];

  const activeStepIndex = steps.findIndex((s) => s.id === step);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-medium font-accent text-emerald-700">
          <Trees className="h-4 w-4" />
          {t('demo.title')}
        </div>
        <h1 className="mt-4 font-display text-3xl font-bold text-gray-900">{t('demo.title')}</h1>
        <p className="mt-2 font-body text-gray-600">{t('demo.description')}</p>
      </div>

      {/* Step Progress */}
      <div className="mt-8 flex items-center justify-center gap-2">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center">
            <div className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold',
              activeStepIndex >= i ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-500'
            )}>
              {activeStepIndex > i ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
            </div>
            <span className={cn(
              'ml-2 hidden text-sm font-medium sm:inline',
              activeStepIndex >= i ? 'text-emerald-700' : 'text-gray-400'
            )}>{s.label}</span>
            {i < steps.length - 1 && <ChevronRight className="mx-2 h-4 w-4 text-gray-300" />}
          </div>
        ))}
      </div>

      {/* Demo Content */}
      <div className="mt-8 space-y-6">
        {step === 'idle' && (
          <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/50 p-10">
            <Play className="h-16 w-16 text-emerald-400" />
            <p className="text-center text-gray-600">
              Esta demo creará cuentas en Stellar Testnet, registrará acciones de conservación y calculará la reputación MVRS.
            </p>
            <button
              onClick={runAccountsDemo}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-8 py-3 text-base font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
              {t('demo.start_demo')}
            </button>
          </div>
        )}

        {step === 'accounts' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Paso 1: Cuentas Creadas</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {community && <AccountCard account={community} />}
              {leaders.map((l) => <AccountCard key={l.id} account={l} />)}
              {members.map((m) => <AccountCard key={m.id} account={m} />)}
            </div>
            <button
              onClick={runActionsDemo}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
              Siguiente: Registrar Acciones
            </button>
          </div>
        )}

        {(step === 'actions' || step === 'reputation' || step === 'complete') && demoActions.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Paso 2: Acciones de Conservación</h2>
            <div className="space-y-3">
              {demoActions.map((action) => (
                <ActionCard key={action.id} action={action} />
              ))}
            </div>
            {step === 'actions' && (
              <button
                onClick={runReputationDemo}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
                Siguiente: Calcular Reputación
              </button>
            )}
          </div>
        )}

        {(step === 'reputation' || step === 'complete') && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Paso 3: Reputación MVRS</h2>
            <ReputationScoreDisplay score={demoScore} />
            {members[0] && (
              <CertificateCard
                memberName={members[0].name}
                memberPublicKey={members[0].publicKey}
                certified={false}
              />
            )}
          </div>
        )}

        {step === 'complete' && (
          <div className="flex items-center justify-center gap-4 pt-4">
            <button
              onClick={resetDemo}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <RotateCcw className="h-4 w-4" />
              {t('demo.reset_demo')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
