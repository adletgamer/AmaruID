import { useState } from 'react';
import { Loader2, Plus } from 'lucide-react';

interface AccountCreatorProps {
  role: 'community' | 'leader' | 'member';
  onCreateAccount: (name: string) => Promise<void>;
  loading?: boolean;
  disabled?: boolean;
}

export function AccountCreator({ role, onCreateAccount, loading, disabled }: AccountCreatorProps) {
  const [name, setName] = useState('');

  const labels = {
    community: 'Nombre de la Comunidad',
    leader: 'Nombre del Líder',
    member: 'Nombre del Miembro',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await onCreateAccount(name.trim());
    setName('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={labels[role]}
        disabled={disabled || loading}
        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={disabled || loading || !name.trim()}
        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        Crear
      </button>
    </form>
  );
}
