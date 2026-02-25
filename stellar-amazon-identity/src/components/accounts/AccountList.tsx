import type { AnyAccount } from '@/types/account';
import { AccountCard } from './AccountCard';

interface AccountListProps {
  accounts: AnyAccount[];
  selectedId?: string;
  onSelect?: (account: AnyAccount) => void;
}

export function AccountList({ accounts, selectedId, onSelect }: AccountListProps) {
  if (accounts.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-gray-200 p-8 text-center">
        <p className="text-sm text-gray-500">No hay cuentas creadas aún</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {accounts.map((account) => (
        <AccountCard
          key={account.id}
          account={account}
          selected={account.id === selectedId}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
