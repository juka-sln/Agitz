import type { TemplateParams } from '@/shared/interpolate';

/** Either a template with `{param}` placeholders, or a function when the wording depends on the values. */
export type ExplanationText = string | ((params: TemplateParams) => string);

export function plural(count: string | number | undefined, one: string, other: string): string {
  return Number(count) === 1 ? one : other;
}
