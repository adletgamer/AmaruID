import { useAuthContext } from '@/contexts/AuthContext';
import { useAppTranslation } from '@/hooks/useTranslation';
import { IssueCertificate } from '@/components/certification/IssueCertificate';
import { db } from '@/lib/storage/schema';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export function LeaderCertify() {
  const { t } = useAppTranslation();
  const { community, leaders, members, refreshAccounts } = useAuthContext();

  const uncertifiedMembers = members.filter((m) => !m.certified);

  const handleCertifySuccess = async (memberId: string) => {
    await db.members.update(memberId, {
      certified: true,
      certifiedAt: new Date().toISOString(),
    });
    await refreshAccounts();
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center gap-3">
        <Link to="/leader" className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">{t('leader.pending_certifications')}</h1>
      </div>

      {uncertifiedMembers.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 p-8 text-center">
          <p className="text-sm text-gray-500">{t('leader.no_pending')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {uncertifiedMembers.map((member) =>
            community ? (
              <IssueCertificate
                key={member.id}
                member={member}
                community={community}
                leaders={leaders}
                onSuccess={() => handleCertifySuccess(member.id)}
              />
            ) : null
          )}
        </div>
      )}
    </div>
  );
}
