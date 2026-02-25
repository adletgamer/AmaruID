import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { actionFormSchema, type ActionFormValues } from '@/lib/utils/validators';
import { ACTION_CATEGORIES, type ActionCategory } from '@/types/action';
import { useAppTranslation } from '@/hooks/useTranslation';
import { Loader2, Send } from 'lucide-react';

interface ActionFormProps {
  onSubmit: (data: ActionFormValues) => Promise<void>;
  loading?: boolean;
}

export function ActionForm({ onSubmit, loading }: ActionFormProps) {
  const { t } = useAppTranslation();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ActionFormValues>({
    resolver: zodResolver(actionFormSchema),
  });

  const handleFormSubmit = async (data: ActionFormValues) => {
    await onSubmit(data);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          {t('actions.category')}
        </label>
        <select
          {...register('category')}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          {(Object.keys(ACTION_CATEGORIES) as ActionCategory[]).map((key) => (
            <option key={key} value={key}>
              {ACTION_CATEGORIES[key].icon} {ACTION_CATEGORIES[key].labelEs}
            </option>
          ))}
        </select>
        {errors.category && (
          <p className="mt-1 text-xs text-red-500">{errors.category.message}</p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          {t('actions.title')}
        </label>
        <input
          {...register('title')}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          placeholder="Ej: Plantación de 50 árboles nativos"
        />
        {errors.title && (
          <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          {t('actions.description')}
        </label>
        <textarea
          {...register('description')}
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          placeholder="Describe la acción de conservación realizada..."
        />
        {errors.description && (
          <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          {t('actions.evidence_url')}
        </label>
        <input
          {...register('evidenceUrl')}
          type="url"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          placeholder="https://..."
        />
        {errors.evidenceUrl && (
          <p className="mt-1 text-xs text-red-500">{errors.evidenceUrl.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {t('actions.submit')}
      </button>
    </form>
  );
}
