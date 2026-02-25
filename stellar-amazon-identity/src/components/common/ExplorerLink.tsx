import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface ExplorerLinkProps {
  type: 'account' | 'transaction';
  id: string;
  label?: string;
  className?: string;
}

const EXPLORER_BASE = 'https://stellar.expert/explorer/testnet';

export function ExplorerLink({ type, id, label, className }: ExplorerLinkProps) {
  const path = type === 'account' ? 'account' : 'tx';
  const url = `${EXPLORER_BASE}/${path}/${id}`;
  const displayLabel = label || `${id.substring(0, 8)}...${id.substring(id.length - 4)}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-800 hover:underline',
        className
      )}
    >
      {displayLabel}
      <ExternalLink className="h-3 w-3" />
    </a>
  );
}
