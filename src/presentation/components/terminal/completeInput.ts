import type { Completion } from '@/infrastructure/shell/completion';

function commonPrefix(values: readonly string[]): string {
  const [first = '', ...rest] = values;
  let length = first.length;
  for (const value of rest) {
    while (!value.startsWith(first.slice(0, length))) {
      length -= 1;
    }
  }
  return first.slice(0, length);
}

/** Applies Tab completion like bash: complete a unique match, otherwise extend and list. */
export function completeInput(
  input: string,
  { word, candidates }: Completion,
): { input: string; suggestions: readonly string[] } {
  const base = input.slice(0, input.length - word.length);
  const [only] = candidates;
  if (candidates.length === 1 && only !== undefined) {
    return { input: `${base}${only}${only.endsWith('/') ? '' : ' '}`, suggestions: [] };
  }
  const prefix = commonPrefix(candidates);
  return {
    input: prefix.length > word.length ? `${base}${prefix}` : input,
    suggestions: candidates,
  };
}
