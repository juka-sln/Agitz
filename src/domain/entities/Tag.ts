import type { Hash } from '../value-objects/Hash';
import type { Identity } from '../value-objects/Identity';
import type { Timestamp } from '../value-objects/Timestamp';

export interface TagAnnotation {
  readonly message: string;
  readonly tagger: Identity;
  readonly taggedAt: Timestamp;
}

/** A fixed name on a commit. Annotated tags (releases) also record who tagged, when and why. */
export interface Tag {
  readonly target: Hash;
  readonly annotation: TagAnnotation | null;
}
