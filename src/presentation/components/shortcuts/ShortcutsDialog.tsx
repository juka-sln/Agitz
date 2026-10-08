import { useEffect, useRef } from 'react';

import { useTranslation } from '../../hooks/useTranslation';
import type { MessageKey } from '../../i18n/messages';
import { useShortcutsStore } from '../../stores/shortcutsStore';

import { SHORTCUT_LETTERS, type PanelShortcut } from './globalShortcuts';

interface ShortcutRow {
  /** Each key of the combination, as printed on an English keyboard. */
  readonly keys: readonly string[];
  readonly description: MessageKey;
}

const PANEL_SHORTCUTS: readonly PanelShortcut[] = [
  'focusTerminal',
  'toggleDocs',
  'toggleGitHub',
  'toggleEditor',
  'toggleMissions',
  'nextUser',
];

const GROUPS: readonly { readonly title: MessageKey; readonly rows: readonly ShortcutRow[] }[] = [
  {
    title: 'shortcuts.everywhere',
    rows: [
      ...PANEL_SHORTCUTS.map((shortcut) => ({
        keys: ['Alt', 'Shift', SHORTCUT_LETTERS[shortcut]],
        description: `shortcuts.${shortcut}` as const,
      })),
      { keys: ['?'], description: 'shortcuts.showShortcuts' },
      { keys: ['Esc'], description: 'shortcuts.closePanel' },
    ],
  },
  {
    title: 'shortcuts.terminal',
    rows: [
      { keys: ['Enter'], description: 'shortcuts.run' },
      { keys: ['↑', '↓'], description: 'shortcuts.history' },
      { keys: ['Tab'], description: 'shortcuts.complete' },
      { keys: ['F1'], description: 'shortcuts.docs' },
      { keys: ['Ctrl', 'L'], description: 'shortcuts.clear' },
      { keys: ['Ctrl', 'C'], description: 'shortcuts.cancel' },
      { keys: ['Esc'], description: 'shortcuts.leave' },
    ],
  },
  {
    title: 'shortcuts.editor',
    rows: [{ keys: ['Ctrl', 'S'], description: 'shortcuts.save' }],
  },
];

/** Keys whose name is printed differently on other keyboards, such as `Maj` in French. */
const TRANSLATED_KEYS: ReadonlyMap<string, MessageKey> = new Map([
  ['Shift', 'key.shift'],
  ['Enter', 'key.enter'],
  ['Esc', 'key.escape'],
]);

function KeyCap({ name }: { readonly name: string }) {
  const { t } = useTranslation();
  const translated = TRANSLATED_KEYS.get(name);
  return (
    <kbd className="border-rule bg-surface-raised min-w-6 rounded border px-1.5 py-0.5 text-center font-mono text-xs">
      {translated === undefined ? name : t(translated)}
    </kbd>
  );
}

/** A native modal dialog: it traps focus, closes with Escape and gives focus back on its own. */
export function ShortcutsDialog() {
  const { t } = useTranslation();
  const isOpen = useShortcutsStore((state) => state.isOpen);
  const close = useShortcutsStore((state) => state.close);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) {
      return;
    }
    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="shortcuts-title"
      onClose={close}
      className="border-rule bg-surface text-ink m-auto w-[min(34rem,calc(100%-2rem))] rounded-lg border p-0 text-sm shadow-2xl backdrop:bg-black/50"
    >
      <div className="border-rule flex items-center justify-between border-b px-5 py-3">
        <h2 id="shortcuts-title" className="text-base font-bold">
          {t('shortcuts.title')}
        </h2>
        <button
          type="button"
          onClick={close}
          className="text-ink-muted hover:bg-surface-raised hover:text-ink rounded-md px-2 py-1 text-sm font-semibold"
        >
          {t('shortcuts.close')}
        </button>
      </div>
      <div className="relative max-h-[70vh] overflow-y-auto px-5 pt-2 pb-5">
        {GROUPS.map((group) => (
          <section key={group.title} aria-labelledby={group.title} className="mt-3">
            <h3 id={group.title} className="text-ink-muted mb-1 text-xs font-bold uppercase">
              {t(group.title)}
            </h3>
            <dl className="divide-rule divide-y">
              {group.rows.map((row) => (
                <div
                  key={`${group.title}-${row.description}`}
                  className="flex items-center justify-between gap-4 py-1.5"
                >
                  <dt className="order-last flex shrink-0 gap-1">
                    {row.keys.map((key) => (
                      <KeyCap key={key} name={key} />
                    ))}
                  </dt>
                  <dd>{t(row.description)}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </dialog>
  );
}
