export type Language = 'fr' | 'en';

export const LANGUAGES: readonly Language[] = ['fr', 'en'];

/** A value written once per supported language. */
export type Localized<T> = Readonly<Record<Language, T>>;
