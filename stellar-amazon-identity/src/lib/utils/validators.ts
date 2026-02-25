import { z } from 'zod';

export const accountNameSchema = z
  .string()
  .min(2, 'El nombre debe tener al menos 2 caracteres')
  .max(50, 'El nombre no puede exceder 50 caracteres')
  .regex(/^[a-zA-ZáéíóúñÁÉÍÓÚÑ\s\-]+$/, 'Solo letras, espacios y guiones');

export const communitySetupSchema = z.object({
  communityName: z
    .string()
    .min(3, 'El nombre de la comunidad debe tener al menos 3 caracteres')
    .max(100),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres').max(500),
  leaderCount: z.number().min(2, 'Se necesitan al menos 2 líderes').max(10),
  threshold: z.number().min(1),
});

export const actionFormSchema = z.object({
  category: z.enum([
    'reforestation',
    'water_monitoring',
    'wildlife_protection',
    'education',
    'cultural_preservation',
    'waste_management',
  ]),
  title: z.string().min(5, 'El título debe tener al menos 5 caracteres').max(100),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres').max(500),
  evidenceUrl: z.string().url('URL no válida').optional().or(z.literal('')),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export type CommunitySetupForm = z.infer<typeof communitySetupSchema>;
export type ActionFormValues = z.infer<typeof actionFormSchema>;
