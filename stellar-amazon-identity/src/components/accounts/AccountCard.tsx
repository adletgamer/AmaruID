import type { AnyAccount } from '@/types/account';
import { CopyButton } from '@/components/common/CopyButton';
import { ExplorerLink } from '@/components/common/ExplorerLink';
import { truncateAddress } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';
import { User, Users, Shield, CheckCircle2, Clock } from 'lucide-react';

interface AccountCardProps {
  account: AnyAccount;
  onSelect?: (account: AnyAccount) => void;
  selected?: boolean;
}

const roleConfig = {
  community: { icon: Users, color: 'emerald', label: 'Comunidad' },
  leader: { icon: Shield, color: 'blue', label: 'Líder' },
  member: { icon: User, color: 'amber', label: 'Miembro' },
};

export function AccountCard({ account, onSelect, selected }: AccountCardProps) {
  const config = roleConfig[account.role];
  const Icon = config.icon;

  return (
    <div
      onClick={() => onSelect?.(account)}
      className={cn(
        'group relative cursor-pointer rounded-xl border-2 p-4 transition-all hover:shadow-md',
        selected
          ? 'border-emerald-500 bg-emerald-50 shadow-md'
          : 'border-gray-200 bg-white hover:border-emerald-200'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full',
              `bg-${config.color}-100 text-${config.color}-600`
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{account.name}</h3>
            <span className={cn('text-xs font-medium', `text-${config.color}-600`)}>
              {config.label}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {account.funded ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          ) : (
            <Clock className="h-4 w-4 text-amber-500" />
          )}
        </div>
      </div>

      <div className="mt-3 space-y-1">
        <div className="flex items-center gap-2">
          <code className="text-xs text-gray-500">
            {truncateAddress(account.publicKey)}
          </code>
          <CopyButton text={account.publicKey} />
        </div>
        <ExplorerLink type="account" id={account.publicKey} />
      </div>

      {account.role === 'member' && 'certified' in account && (
        <div className="mt-2">
          {account.certified ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
              <CheckCircle2 className="h-3 w-3" /> Certificado
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
              <Clock className="h-3 w-3" /> Pendiente
            </span>
          )}
        </div>
      )}
    </div>
  );
}
