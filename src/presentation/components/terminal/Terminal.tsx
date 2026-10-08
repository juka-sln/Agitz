import { useEffect, useRef, useState, type KeyboardEvent } from 'react';

import { findDocIdForCommandLine } from '@/content/docs';
import { hasUnmergedPaths } from '@/domain/entities/Repository';

import { useFirstSteps } from '../../hooks/useFirstSteps';
import { useSession } from '../../hooks/useSession';
import { useTranslation } from '../../hooks/useTranslation';
import { useDocsStore } from '../../stores/docsStore';
import { useEditorStore } from '../../stores/editorStore';
import { docTitle } from '../docs/docTitle';

import { completeInput } from './completeInput';
import { Prompt } from './Prompt';
import { TerminalExplanation } from './TerminalExplanation';
import { TerminalOutput } from './TerminalOutput';

export function Terminal() {
  const { t, language } = useTranslation();
  const workspace = useSession((state) => state.workspace);
  const entries = useSession((state) => state.entries);
  const commandHistory = useSession((state) => state.commandHistory);
  const showWelcome = useSession((state) => state.showWelcome);
  const userName = useSession((state) => state.activeUser.identity.name);
  const firstSteps = useFirstSteps();
  const run = useSession((state) => state.run);
  const complete = useSession((state) => state.complete);
  const clear = useSession((state) => state.clear);
  const openDocs = useDocsStore((state) => state.open);
  const openEditor = useEditorStore((state) => state.open);
  const hasConflicts = workspace.repository !== null && hasUnmergedPaths(workspace.repository);

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
    } else if (event.key === 'F1') {
      event.preventDefault();
      openDocs(
        findDocIdForCommandLine(input) ??
          findDocIdForCommandLine(entries.at(-1)?.commandLine ?? ''),
      );
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
            <p>{t('terminal.welcome.user', { user: userName })}</p>
            <p>
              {t(
                firstSteps.joinsByCloning ? 'terminal.welcome.cloneBody' : 'terminal.welcome.body',
              )}
            </p>
            <pre className="text-terminal-accent mt-1">
              {firstSteps.steps.map((step) => `  ${step}`).join('\n')}
            </pre>
          </div>
        )}
        {entries.map((entry, index) => {
          const docId = findDocIdForCommandLine(entry.commandLine);
          const isLatest = index === entries.length - 1;
          return (
            <div key={entry.id} className="group mb-1">
              <div className="flex flex-wrap items-start">
                <Prompt workspace={entry.workspaceBefore} />
                <span className="break-all whitespace-pre-wrap">{entry.commandLine}</span>
                {docId !== null && !isLatest && (
                  // Kept out of the tab order so the log does not fill up with stops;
                  // F1 and the documentation panel offer the same pages from the keyboard.
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => {
                      openDocs(docId);
                    }}
                    title={t('terminal.learnMoreAbout', { command: docTitle(docId, language) })}
                    aria-label={t('terminal.learnMoreAbout', {
                      command: docTitle(docId, language),
                    })}
                    className="text-terminal-accent ml-2 font-sans opacity-0 group-hover:opacity-100"
                  >
                    ⓘ
                  </button>
                )}
              </div>
              <TerminalOutput output={entry.output} />
              {isLatest && (
                <TerminalExplanation
                  explanation={entry.explanation}
                  docId={docId}
                  onLearnMore={openDocs}
                />
              )}
              {isLatest && hasConflicts && (
                <button
                  type="button"
                  onClick={() => {
                    openEditor(null);
                  }}
                  className="border-terminal-warning text-terminal-warning hover:bg-terminal-warning/10 mb-2 rounded border px-2 py-0.5 font-sans text-xs font-semibold"
                >
                  {t('terminal.resolveConflicts')}
                </button>
              )}
            </div>
          );
        })}
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
