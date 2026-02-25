import { Award, CheckCircle2, Clock } from 'lucide-react';
import { ExplorerLink } from '@/components/common/ExplorerLink';
import { formatDate } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';

interface CertificateCardProps {
  memberName: string;
  memberPublicKey: string;
  certified: boolean;
  certifiedAt?: string;
  transactionHash?: string;
}

export function CertificateCard({
  memberName,
  memberPublicKey,
  certified,
  certifiedAt,
  transactionHash,
}: CertificateCardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border-2 p-6',
        certified
          ? 'border-emerald-300 bg-gradient-to-br from-emerald-50 to-teal-50'
          : 'border-gray-200 bg-gray-50'
      )}
    >
      {certified && (
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-emerald-100/50" />
      )}

      <div className="relative flex items-start gap-4">
        <div
          className={cn(
            'flex h-14 w-14 items-center justify-center rounded-full',
            certified ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-200 text-gray-400'
          )}
        >
          <Award className="h-7 w-7" />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-gray-900">{memberName}</h3>
            {certified ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            ) : (
              <Clock className="h-5 w-5 text-amber-500" />
            )}
          </div>

          <p className="mt-1 text-sm text-gray-500">
            {certified ? 'COMMCERT — Certificado Comunitario' : 'Pendiente de certificación'}
          </p>

          {certifiedAt && (
            <p className="mt-1 text-xs text-gray-400">
              Certificado: {formatDate(certifiedAt)}
            </p>
          )}

          {transactionHash && (
            <div className="mt-2">
              <ExplorerLink type="transaction" id={transactionHash} label="Ver transacción" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
