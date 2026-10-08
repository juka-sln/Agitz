import { ariaKeyShortcut, isEditable, matchGlobalShortcut } from './globalShortcuts';

function press(code: string, key: string, modifiers: Partial<KeyboardEventInit> = {}) {
  return new KeyboardEvent('keydown', { code, key, ...modifiers });
}

describe('matchGlobalShortcut', () => {
  it('matches Alt+Shift letters on the physical key', () => {
    expect(matchGlobalShortcut(press('KeyD', 'Î', { altKey: true, shiftKey: true }), true)).toBe(
      'toggleDocs',
    );
    expect(matchGlobalShortcut(press('KeyT', 'T', { altKey: true, shiftKey: true }), false)).toBe(
      'focusTerminal',
    );
    expect(matchGlobalShortcut(press('KeyU', 'U', { altKey: true, shiftKey: true }), false)).toBe(
      'nextUser',
    );
  });

  it('ignores the same letters without both modifiers or with Ctrl', () => {
    expect(matchGlobalShortcut(press('KeyD', 'd', { altKey: true }), false)).toBeNull();
    expect(matchGlobalShortcut(press('KeyD', 'D', { shiftKey: true }), false)).toBeNull();
    expect(
      matchGlobalShortcut(
        press('KeyD', 'D', { altKey: true, shiftKey: true, ctrlKey: true }),
        false,
      ),
    ).toBeNull();
    expect(
      matchGlobalShortcut(press('KeyX', 'X', { altKey: true, shiftKey: true }), false),
    ).toBeNull();
  });

  it('opens the help with ? unless the key would type text', () => {
    expect(matchGlobalShortcut(press('Slash', '?', { shiftKey: true }), false)).toBe(
      'showShortcuts',
    );
    expect(matchGlobalShortcut(press('Slash', '?', { shiftKey: true }), true)).toBeNull();
  });
});

describe('isEditable', () => {
  it('tells text fields apart from buttons and checkboxes', () => {
    const text = document.createElement('input');
    const checkbox = Object.assign(document.createElement('input'), { type: 'checkbox' });

    expect(isEditable(text)).toBe(true);
    expect(isEditable(document.createElement('textarea'))).toBe(true);
    expect(isEditable(checkbox)).toBe(false);
    expect(isEditable(document.createElement('button'))).toBe(false);
    expect(isEditable(null)).toBe(false);
  });
});

it('describes shortcuts for assistive technologies', () => {
  expect(ariaKeyShortcut('toggleGitHub')).toBe('Alt+Shift+G');
});
