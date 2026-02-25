import { useAuthContext } from '@/contexts/AuthContext';
import { useAppTranslation } from '@/hooks/useTranslation';
import { CertificateCard } from '@/components/certification/CertificateCard';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export function MemberCertificate() {
  const { t } = useAppTranslation();
  const { currentAccount } = useAuthContext();

  const member = currentAccount?.role === 'member' ? currentAccount : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center gap-3">
        <Link to="/member" className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">{t('member.my_certificate')}</h1>
      </div>

      {member ? (
        <CertificateCard
          memberName={member.name}
          memberPublicKey={member.publicKey}
          certified={member.certified}
          certifiedAt={member.certifiedAt}
        />
      ) : (
        <div className="rounded-xl border-2 border-dashed border-gray-200 p-8 text-center">
          <p className="text-sm text-gray-500">Selecciona un miembro desde el dashboard primero</p>
        </div>
      )}

      <div className="mt-6 rounded-lg bg-gray-50 p-4">
        <h3 className="text-sm font-semibold text-gray-700">¿Qué es COMMCERT?</h3>
        <p className="mt-1 text-xs leading-relaxed text-gray-500">
          COMMCERT es un asset personalizado en Stellar que representa la certificación comunitaria.
          Cuando la asamblea (cuenta multisig) emite un COMMCERT a un miembro, confirma que es un
          miembro verificado de la comunidad. Esta certificación es pública y verificable por cualquiera
          en la blockchain de Stellar.
        </p>
      </div>
    </div>
  );
}
