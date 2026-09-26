export interface Identity {
  readonly name: string;
  readonly email: string;
}

export function formatIdentity(identity: Identity): string {
  return `${identity.name} <${identity.email}>`;
}
