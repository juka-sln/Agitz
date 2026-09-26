export class ShellSyntaxError extends Error {}

export type ShellToken =
  | { readonly type: 'word'; readonly value: string }
  | { readonly type: 'redirect'; readonly append: boolean };

const ESCAPABLE_IN_DOUBLE_QUOTES = new Set(['"', '\\', '$', '`']);

/**
 * Splits a command line like a POSIX shell: whitespace separates arguments,
 * single quotes are literal, double quotes allow `\"`, a backslash outside quotes
 * escapes the next character, and unquoted `>` / `>>` are output redirections.
 */
export function tokenizeShell(line: string): ShellToken[] {
  const tokens: ShellToken[] = [];
  let current = '';
  let inToken = false;
  let quote: "'" | '"' | null = null;

  for (let index = 0; index < line.length; index += 1) {
    const character = line.charAt(index);
    const next = line.charAt(index + 1);

    if (quote === "'") {
      if (character === "'") {
        quote = null;
      } else {
        current += character;
      }
    } else if (quote === '"') {
      if (character === '"') {
        quote = null;
      } else if (character === '\\' && ESCAPABLE_IN_DOUBLE_QUOTES.has(next)) {
        current += next;
        index += 1;
      } else {
        current += character;
      }
    } else if (character === "'" || character === '"') {
      quote = character;
      inToken = true;
    } else if (character === '\\') {
      current += next;
      index += 1;
      inToken = true;
    } else if (/\s/.test(character) || character === '>') {
      if (inToken) {
        tokens.push({ type: 'word', value: current });
        current = '';
        inToken = false;
      }
      if (character === '>') {
        const append = next === '>';
        tokens.push({ type: 'redirect', append });
        index += append ? 1 : 0;
      }
    } else {
      current += character;
      inToken = true;
    }
  }

  if (quote !== null) {
    throw new ShellSyntaxError(`unexpected EOF while looking for matching \`${quote}'`);
  }
  if (inToken) {
    tokens.push({ type: 'word', value: current });
  }
  return tokens;
}

/** Arguments only: redirections are kept as their literal `>` / `>>` text. */
export function tokenize(line: string): string[] {
  return tokenizeShell(line).map((token) => {
    if (token.type === 'word') {
      return token.value;
    }
    return token.append ? '>>' : '>';
  });
}
