function editDistance(left: string, right: string): number {
  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= right.length; j += 1) {
      const substitution = (previous[j - 1] ?? 0) + (left[i - 1] === right[j - 1] ? 0 : 1);
      current.push(Math.min((previous[j] ?? 0) + 1, (current[j - 1] ?? 0) + 1, substitution));
    }
    previous = current;
  }
  return previous[right.length] ?? 0;
}

const MAX_DISTANCE = 2;

/** Closest known commands to a mistyped one, best matches first. */
export function suggestCommands(typed: string, known: readonly string[]): string[] {
  const scored = known
    .map((name) => ({ name, distance: editDistance(typed, name) }))
    .filter(({ distance }) => distance <= MAX_DISTANCE && distance < typed.length);
  const best = Math.min(...scored.map(({ distance }) => distance));
  return scored
    .filter(({ distance }) => distance === best)
    .map(({ name }) => name)
    .sort();
}
