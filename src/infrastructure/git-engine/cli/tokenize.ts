export class ShellSyntaxError extends Error {}

const ESCAPABLE_IN_DOUBLE_QUOTES = new Set(['"', '\\', '$', '`']);

/**
 * Splits a command line into arguments like a POSIX shell: whitespace separates
 * arguments, single quotes are literal, double quotes allow `\"`, and a backslash
 * outside quotes escapes the next character.
 */
export function tokenize(line: string): string[] {
  const tokens: string[] = [];
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
    } else if (/\s/.test(character)) {
      if (inToken) {
        tokens.push(current);
        current = '';
        inToken = false;
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
    tokens.push(current);
  }
  return tokens;
}
