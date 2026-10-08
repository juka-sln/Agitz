export interface RichTextSegment {
  readonly kind: 'text' | 'code' | 'strong';
  readonly text: string;
}

/** Splits `code` spans first, so that stars inside code stay literal, then **strong** spans. */
export function parseRichText(source: string): RichTextSegment[] {
  const segments: RichTextSegment[] = [];
  source.split('`').forEach((part, index) => {
    if (index % 2 === 1) {
      segments.push({ kind: 'code', text: part });
      return;
    }
    part.split('**').forEach((piece, pieceIndex) => {
      if (piece !== '') {
        segments.push({ kind: pieceIndex % 2 === 1 ? 'strong' : 'text', text: piece });
      }
    });
  });
  return segments;
}
