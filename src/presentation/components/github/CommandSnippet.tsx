import { useState } from 'react';

import { useTranslation } from '../../hooks/useTranslation';

/** A command to type in the terminal, with a button copying it to the clipboard. */
export function CommandSnippet({ command }: { readonly command: string }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const copy = () => {
    void navigator.clipboard.writeText(command).then(() => {
      setCopied(true);
    });
  };

  return (
    <div className="bg-terminal text-terminal-ink flex items-center gap-2 rounded-md py-1 pr-1 pl-3">
      <code className="min-w-0 flex-1 font-mono text-xs break-all">{command}</code>
      <button
        type="button"
        onClick={copy}
        className="text-terminal-muted hover:text-terminal-ink shrink-0 rounded px-1.5 py-0.5 text-xs font-semibold"
      >
        {copied ? t('github.copied') : t('github.copy')}
        <span className="sr-only">: {command}</span>
      </button>
    </div>
  );
}
