export const CONVENTIONAL_TYPES = [
  'build',
  'chore',
  'ci',
  'docs',
  'feat',
  'fix',
  'perf',
  'refactor',
  'revert',
  'style',
  'test',
] as const;

const HEADER_PATTERN = new RegExp(
  `^(?:${CONVENTIONAL_TYPES.join('|')})(?:\\([\\w./-]+\\))?!?: \\S`,
);

/** commitlint's default limit for the first line. */
export const HEADER_MAX_LENGTH = 100;

/** `feat(parser): add arrays` is conventional; `Added stuff` is not. */
export function isConventionalHeader(header: string): boolean {
  return HEADER_PATTERN.test(header) && header.length <= HEADER_MAX_LENGTH;
}

/** Messages Git writes itself, which commitlint ignores by default. */
export function isGeneratedHeader(header: string): boolean {
  return /^(?:Merge |Revert ")/.test(header);
}
