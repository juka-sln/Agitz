import { interpolate, type TemplateParams } from '@/shared/interpolate';
import type { Language, Localized } from '@/shared/language';

import { en } from './en';
import { fr } from './fr';
import type { ExplanationText } from './types';

export type ExplanationKey = keyof typeof fr;

const CATALOG: Localized<Readonly<Record<ExplanationKey, ExplanationText>>> = { fr, en };

export const EXPLANATION_KEYS = Object.keys(fr) as readonly ExplanationKey[];

function isExplanationKey(key: string): key is ExplanationKey {
  return Object.hasOwn(fr, key);
}

/**
 * Turns the explanation attached to a command result into a sentence for the learner.
 * Returns an empty string when there is nothing worth explaining (plain `echo`, `ls`...).
 */
export function formatExplanation(key: string, params: TemplateParams, language: Language): string {
  if (!isExplanationKey(key)) {
    return '';
  }
  const text = CATALOG[language][key];
  return typeof text === 'function' ? text(params) : interpolate(text, params);
}
