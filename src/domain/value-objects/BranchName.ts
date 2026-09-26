import { InvalidBranchNameError } from '../errors/BranchErrors';

export type BranchName = string & { readonly __brand: 'BranchName' };

const FORBIDDEN_CHARACTERS = new Set([' ', '~', '^', ':', '?', '*', '[', '\\']);

function hasForbiddenCharacter(name: string): boolean {
  for (const character of name) {
    const code = character.charCodeAt(0);
    if (code < 0x20 || code === 0x7f || FORBIDDEN_CHARACTERS.has(character)) {
      return true;
    }
  }
  return false;
}

/** Simplified version of the rules enforced by `git check-ref-format --branch`. */
export function isValidBranchName(name: string): name is BranchName {
  if (name === '' || name === '@' || name === 'HEAD') {
    return false;
  }
  if (name.startsWith('-') || name.startsWith('/') || name.endsWith('/') || name.endsWith('.')) {
    return false;
  }
  if (name.includes('..') || name.includes('//') || name.includes('@{')) {
    return false;
  }
  if (hasForbiddenCharacter(name)) {
    return false;
  }
  return name
    .split('/')
    .every((component) => !component.startsWith('.') && !component.endsWith('.lock'));
}

export function parseBranchName(name: string): BranchName {
  if (!isValidBranchName(name)) {
    throw new InvalidBranchNameError(name);
  }
  return name;
}
