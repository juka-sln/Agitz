export type TemplateParams = Readonly<Record<string, string | number>>;

/** Replaces `{name}` placeholders; unknown names are left as they are so mistakes stay visible. */
export function interpolate(template: string, params: TemplateParams): string {
  return template.replace(/\{(\w+)\}/g, (placeholder, name: string) =>
    String(params[name] ?? placeholder),
  );
}
