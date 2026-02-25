import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { useAppTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils/cn';

interface CopyButtonProps {
  text: string;
  className?: string;
}

export function CopyButton({ text, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const { t } = useAppTranslation();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors',
        copied
          ? 'bg-emerald-100 text-emerald-700'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
        className
      )}
      title={copied ? t('common.copied') : t('common.copy')}
    >
      {copied ? (
        <>
          <Check className="h-3 w-3" />
          {t('common.copied')}
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" />
          {t('common.copy')}
        </>
      )}
    </button>
  );
}
