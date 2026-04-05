import { type Template, templates as mockTemplates } from '@/src/data/templates';

export type { Template };

/**
 * Templates service — single read layer for all template data.
 * Currently returns local mock data. Will be swapped for Firestore
 * or server fetch in a future phase without changing consumers.
 */

export async function getTemplates(): Promise<Template[]> {
  return mockTemplates;
}

export async function getTemplateById(id: string): Promise<Template | null> {
  return mockTemplates.find((t) => t.id === id) ?? null;
}

export function getTemplatesSync(): Template[] {
  return mockTemplates;
}

export function getTemplateByIdSync(id: string): Template | null {
  return mockTemplates.find((t) => t.id === id) ?? null;
}

export function getRecommendedTemplates(): Template[] {
  return mockTemplates.filter((t) => t.category === 'recommended');
}

export function getTrendingTemplates(): Template[] {
  return mockTemplates.filter((t) => t.category === 'trending');
}
