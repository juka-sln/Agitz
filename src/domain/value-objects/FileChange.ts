export type FileChangeType = 'added' | 'modified' | 'deleted';

export interface FileChange {
  readonly path: string;
  readonly type: FileChangeType;
}
