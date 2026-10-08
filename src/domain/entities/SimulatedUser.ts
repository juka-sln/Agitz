import type { Identity } from '../value-objects/Identity';

/** A fictional teammate with their own workstation, so one learner can rehearse teamwork alone. */
export interface SimulatedUser {
  /** Login used in paths and prompts, e.g. `alice` for `/home/alice/project`. */
  readonly id: string;
  readonly identity: Identity;
}

export const USER_NAME_MAX_LENGTH = 20;

export type UserNameProblem = 'empty' | 'tooLong' | 'invalid' | 'taken';

const LOGIN_PATTERN = /^[a-z][a-z0-9-]*$/;

/** `Émilie Durand` becomes `emilie-durand`. */
export function userLogin(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function findUserNameProblem(
  name: string,
  existing: readonly SimulatedUser[],
): UserNameProblem | null {
  const trimmed = name.trim();
  if (trimmed === '') {
    return 'empty';
  }
  if (trimmed.length > USER_NAME_MAX_LENGTH) {
    return 'tooLong';
  }
  const login = userLogin(trimmed);
  if (!LOGIN_PATTERN.test(login)) {
    return 'invalid';
  }
  return existing.some((user) => user.id === login) ? 'taken' : null;
}

/** Call {@link findUserNameProblem} first: the name is expected to be valid. */
export function createSimulatedUser(name: string): SimulatedUser {
  const login = userLogin(name);
  return { id: login, identity: { name: name.trim(), email: `${login}@agitz.dev` } };
}

/** Each workstation starts in an empty project folder in its user's home directory. */
export function projectDirectory(user: SimulatedUser): string {
  return `/home/${user.id}/project`;
}
