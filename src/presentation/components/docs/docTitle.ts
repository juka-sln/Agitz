import { findDoc } from '@/content/docs';
import type { Language } from '@/shared/language';

export function docTitle(id: string, language: Language): string {
  const doc = findDoc(id);
  if (doc === undefined) {
    return id;
  }
  return doc.kind === 'command' ? doc.title : doc.text[language].title;
}
