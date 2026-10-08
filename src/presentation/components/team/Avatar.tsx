export function Avatar({ name, colorToken }: { name: string; colorToken: string }) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
      style={{ background: `var(--${colorToken})`, color: `var(--${colorToken}-ink)` }}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}
