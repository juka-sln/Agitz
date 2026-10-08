import { useId, type ButtonHTMLAttributes, type ReactNode } from 'react';

import type { GitHubProblem } from '@/application/github-features/HostingState';

import { useTranslation } from '../../hooks/useTranslation';

import { problemMessage } from './problemMessages';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'quiet';

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-(--line-1) text-(--line-1-ink) hover:brightness-110',
  secondary: 'border border-rule bg-surface text-ink hover:bg-surface-raised',
  // Red text loses contrast on the raised background: hovering only outlines the button.
  danger: 'border border-rule bg-surface text-status-deleted hover:border-status-deleted',
  quiet: 'text-ink-muted hover:bg-surface-raised hover:text-ink',
};

export function Button({
  variant = 'secondary',
  className = '',
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { readonly variant?: ButtonVariant }) {
  return (
    <button
      // The type is always one of the three valid values, defaulting to a plain button.

      type={type}
      className={`inline-flex items-center justify-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${BUTTON_VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}

export type Tone = 'open' | 'merged' | 'closed' | 'neutral' | 'success' | 'failure';

const TONES: Record<Tone, string> = {
  open: 'bg-(--line-1) text-(--line-1-ink)',
  success: 'bg-(--line-1) text-(--line-1-ink)',
  merged: 'bg-(--line-3) text-(--line-3-ink)',
  closed: 'bg-(--line-5) text-(--line-5-ink)',
  failure: 'bg-(--line-5) text-(--line-5-ink)',
  neutral: 'bg-surface-raised text-ink',
};

export function Badge({ tone, children }: { readonly tone: Tone; readonly children: ReactNode }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-semibold ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}

export function ProblemAlert({ problem }: { readonly problem: GitHubProblem | null }) {
  const { t } = useTranslation();
  if (problem === null) {
    return null;
  }
  return (
    <p role="alert" className="text-status-deleted text-sm">
      {problemMessage(t, problem)}
    </p>
  );
}

const fieldClass =
  'border-rule bg-canvas text-ink w-full min-w-0 rounded-md border px-2 py-1.5 text-sm';

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  multiline = false,
  hint,
}: {
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly placeholder?: string;
  readonly multiline?: boolean;
  readonly hint?: string;
}) {
  const id = useId();
  const hintId = useId();
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-ink text-xs font-semibold">
        {label}
      </label>
      {multiline ? (
        <textarea
          id={id}
          value={value}
          rows={4}
          placeholder={placeholder}
          aria-describedby={hint === undefined ? undefined : hintId}
          onChange={(event) => {
            onChange(event.target.value);
          }}
          className={fieldClass}
        />
      ) : (
        <input
          id={id}
          value={value}
          placeholder={placeholder}
          aria-describedby={hint === undefined ? undefined : hintId}
          onChange={(event) => {
            onChange(event.target.value);
          }}
          className={fieldClass}
        />
      )}
      {hint !== undefined && (
        <p id={hintId} className="text-ink-muted text-xs">
          {hint}
        </p>
      )}
    </div>
  );
}

export function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  readonly label: string;
  readonly value: string;
  readonly options: readonly { readonly value: string; readonly label: string }[];
  readonly onChange: (value: string) => void;
}) {
  const id = useId();
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <label htmlFor={id} className="text-ink text-xs font-semibold">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        className={fieldClass}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function EmptyState({ children }: { readonly children: ReactNode }) {
  return (
    <div className="border-rule text-ink-muted rounded-md border border-dashed px-4 py-6 text-center text-sm">
      {children}
    </div>
  );
}

/** A heading for a block inside a page; pages own the single `h2`. */
export function SectionTitle({ children }: { readonly children: ReactNode }) {
  return <h3 className="text-ink text-sm font-bold">{children}</h3>;
}

export function Box({
  children,
  className = '',
}: {
  readonly children: ReactNode;
  readonly className?: string;
}) {
  return <div className={`border-rule rounded-md border ${className}`}>{children}</div>;
}
