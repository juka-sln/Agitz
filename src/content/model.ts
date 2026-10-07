import type { Localized } from '@/shared/language';

/**
 * Documentation is written as typed modules rather than Markdown, so a missing section or
 * translation fails the build. Inside text, `backticks` mark code and **stars** mark emphasis.
 */
export type RichText = string;

export type CommandCategory = 'basics' | 'branches' | 'undo' | 'shell';

export interface CommandOption {
  readonly syntax: string;
  readonly text: RichText;
}

export interface CommandExample {
  readonly command: string;
  readonly text: RichText;
}

export interface CommandDocText {
  readonly summary: RichText;
  readonly description: readonly RichText[];
  readonly options: readonly CommandOption[];
  readonly examples: readonly CommandExample[];
  /** What happens on the graph and inside `.git`. */
  readonly underTheHood: readonly RichText[];
  readonly pitfalls: readonly RichText[];
}

export interface CommandDoc {
  readonly kind: 'command';
  readonly id: string;
  /** The command as it is typed, which never gets translated. */
  readonly title: string;
  readonly category: CommandCategory;
  readonly related: readonly string[];
  readonly text: Localized<CommandDocText>;
}

export type GuideBlock =
  | { readonly type: 'paragraph'; readonly text: RichText }
  | { readonly type: 'list'; readonly items: readonly RichText[] }
  | { readonly type: 'code'; readonly code: string };

export interface GuideSection {
  readonly heading: string;
  readonly blocks: readonly GuideBlock[];
}

export interface GuideDocText {
  readonly title: string;
  readonly summary: RichText;
  readonly sections: readonly GuideSection[];
}

export interface GuideDoc {
  readonly kind: 'guide';
  readonly id: string;
  readonly related: readonly string[];
  readonly text: Localized<GuideDocText>;
}

export type Doc = CommandDoc | GuideDoc;
