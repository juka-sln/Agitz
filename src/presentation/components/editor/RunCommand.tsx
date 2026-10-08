import { useSession } from '../../hooks/useSession';
import { useTranslation } from '../../hooks/useTranslation';

/** A command the next step needs, with a button typing it in the terminal of the active user. */
export function RunCommand({
  command,
  disabled = false,
}: {
  readonly command: string;
  readonly disabled?: boolean;
}) {
  const { t } = useTranslation();
  const run = useSession((state) => state.run);

  return (
    <div className="bg-terminal text-terminal-ink flex items-center gap-2 rounded-md py-1 pr-1 pl-3">
      <code className="min-w-0 flex-1 font-mono text-xs break-all">{command}</code>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          run(command);
        }}
        className="text-terminal-accent hover:bg-terminal-ink/10 shrink-0 rounded px-2 py-0.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50"
        aria-label={t('editor.runCommand', { command })}
      >
        {t('editor.run')}
      </button>
    </div>
  );
}
