import { useEffect, useRef, useState, type KeyboardEvent } from 'react';

import { useSession } from '../../hooks/useSession';
import { useTranslation } from '../../hooks/useTranslation';

import { completeInput } from './completeInput';
import { Prompt } from './Prompt';
import { TerminalOutput } from './TerminalOutput';

const FIRST_STEPS = ['git init', 'echo "# My project" > README.md', 'git status'];

export function Terminal() {
  const { t } = useTranslation();
  const workspace = useSession((state) => state.workspace);
  const entries = useSession((state) => state.entries);
  const commandHistory = useSession((state) => state.commandHistory);
  const showWelcome = useSession((state) => state.showWelcome);
  const run = useSession((state) => state.run);
  const complete = useSession((state) => state.complete);
  const clear = useSession((state) => state.clear);

  const [input, setInput] = useState('');
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<readonly string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [entries, suggestions]);

  const recallHistory = (direction: -1 | 1) => {
    if (commandHistory.length === 0) {
      return;
    }
    const current = historyIndex ?? commandHistory.length;
    const next = Math.min(Math.max(current + direction, 0), commandHistory.length);
    setHistoryIndex(next === commandHistory.length ? null : next);
    setInput(commandHistory[next] ?? '');
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      run(input);
      setInput('');
      setHistoryIndex(null);
      setSuggestions([]);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      recallHistory(-1);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      recallHistory(1);
    } else if (event.key === 'Tab' && !event.shiftKey && input.trim() !== '') {
      // With an empty line, Tab moves focus as usual so the terminal never traps the keyboard.
      event.preventDefault();
      const completed = completeInput(input, complete(input));
      setInput(completed.input);
      setSuggestions(completed.suggestions);
    } else if (event.key === 'Escape') {
      setSuggestions([]);
      inputRef.current?.blur();
    } else if (event.ctrlKey && event.key === 'l') {
      event.preventDefault();
      clear();
    } else if (event.ctrlKey && event.key === 'c') {
      setInput('');
      setSuggestions([]);
    }
  };

  return (
    // The whole panel forwards clicks to the input, like a real terminal; keyboard users reach the input directly.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div
      className="bg-terminal text-terminal-ink flex h-full flex-col font-mono text-[13px] leading-relaxed"
      onClick={() => inputRef.current?.focus()}
    >
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto px-4 py-3"
        role="log"
        aria-label={t('terminal.label')}
      >
        {showWelcome && (
          <div className="text-terminal-muted mb-3">
            <p className="text-terminal-ink">{t('terminal.welcome.title')}</p>
            <p>{t('terminal.welcome.body')}</p>
            <pre className="text-terminal-accent mt-1">
              {FIRST_STEPS.map((step) => `  ${step}`).join('\n')}
            </pre>
          </div>
        )}
        {entries.map((entry) => (
          <div key={entry.id} className="mb-1">
            <div className="flex flex-wrap">
              <Prompt workspace={entry.workspaceBefore} />
              <span className="break-all whitespace-pre-wrap">{entry.commandLine}</span>
            </div>
            <TerminalOutput output={entry.output} />
          </div>
        ))}
        {suggestions.length > 0 && (
          <p className="text-terminal-muted">
            {t('terminal.completions')} {suggestions.join('  ')}
          </p>
        )}
        <p id="terminal-keyboard-help" className="sr-only">
          {t('terminal.keyboardHelp')}
        </p>
        <div className="flex">
          <Prompt workspace={workspace} />
          <input
            ref={inputRef}
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              setSuggestions([]);
            }}
            onKeyDown={handleKeyDown}
            aria-label={t('terminal.inputLabel')}
            aria-describedby="terminal-keyboard-help"
            className="text-terminal-ink caret-terminal-success min-w-0 flex-1 bg-transparent outline-none"
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="off"
            // The terminal is the main way to interact with the app.
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
          />
        </div>
      </div>
    </div>
  );
}
