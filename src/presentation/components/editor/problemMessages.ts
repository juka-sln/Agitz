import type { FileWriteProblem } from '@/domain/entities/Workspace';

import type { MessageKey } from '../../i18n/messages';

export const FILE_WRITE_PROBLEMS: Record<FileWriteProblem, MessageKey> = {
  invalidPath: 'editor.problem.invalidPath',
  isDirectory: 'editor.problem.isDirectory',
  parentIsFile: 'editor.problem.parentIsFile',
};
