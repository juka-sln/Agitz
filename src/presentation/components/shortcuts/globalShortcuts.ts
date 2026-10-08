export type GlobalShortcut =
  | 'focusTerminal'
  | 'toggleDocs'
  | 'toggleGitHub'
  | 'toggleEditor'
  | 'toggleMissions'
  | 'nextUser'
  | 'showShortcuts';

export type PanelShortcut = Exclude<GlobalShortcut, 'showShortcuts'>;

/**
 * Letters pressed with Alt+Shift, which keeps clear of the browser (Alt+D focuses the address
 * bar) and of text editing. They are matched on the physical key, so they work on any layout
 * and with Option on a Mac.
 */
export const SHORTCUT_LETTERS: Readonly<Record<PanelShortcut, string>> = {
  focusTerminal: 'T',
  toggleDocs: 'D',
  toggleGitHub: 'G',
  toggleEditor: 'E',
  toggleMissions: 'M',
  nextUser: 'U',
};

const SHORTCUTS_BY_CODE = new Map(
  Object.entries(SHORTCUT_LETTERS).map(([shortcut, letter]) => [
    `Key${letter}`,
    shortcut as PanelShortcut,
  ]),
);

/** The value of `aria-keyshortcuts`, which uses the key names of the specification. */
export function ariaKeyShortcut(shortcut: PanelShortcut): string {
  return `Alt+Shift+${SHORTCUT_LETTERS[shortcut]}`;
}

type KeyPress = Pick<KeyboardEvent, 'altKey' | 'shiftKey' | 'ctrlKey' | 'metaKey' | 'code' | 'key'>;

/** Whether a key press would type text into the focused element. */
export function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  return (
    target.isContentEditable ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    (target instanceof HTMLInputElement &&
      !['button', 'checkbox', 'radio', 'submit', 'reset'].includes(target.type))
  );
}

export function matchGlobalShortcut(event: KeyPress, isTyping: boolean): GlobalShortcut | null {
  if (event.ctrlKey || event.metaKey) {
    return null;
  }
  if (event.altKey && event.shiftKey) {
    return SHORTCUTS_BY_CODE.get(event.code) ?? null;
  }
  // `?` would be typed as text in a field, so it only opens the help elsewhere.
  return !event.altKey && !isTyping && event.key === '?' ? 'showShortcuts' : null;
}
