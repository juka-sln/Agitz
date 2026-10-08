import { classifyOutputLines, type OutputTone } from './classifyOutput';

const TONE_CLASSES: Record<OutputTone, string> = {
  plain: 'text-terminal-ink',
  error: 'text-terminal-error',
  warning: 'text-terminal-warning',
  hint: 'text-terminal-muted',
  staged: 'text-terminal-success',
  unstaged: 'text-terminal-error',
  current: 'text-terminal-success',
};

export function TerminalOutput({ output }: { output: string }) {
  if (output === '') {
    return null;
  }
  return (
    <pre className="break-words whitespace-pre-wrap [tab-size:4]">
      {classifyOutputLines(output).map((line, index) => (
        // Output lines are static once printed, so their position is a stable key.

        <span key={index} className={`block ${TONE_CLASSES[line.tone]}`}>
          {line.text === '' ? ' ' : line.text}
        </span>
      ))}
    </pre>
  );
}
