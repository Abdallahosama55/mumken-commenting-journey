/**
 * Design tokens — the single source for web CSS variables and React Native styles.
 *
 * Values are read from the Figma reference's rendered preview (exact node values were not accessible;
 * see requirements §6.1). Text colours are chosen to meet WCAG 2.2 AA on their intended surfaces (A-4):
 * `textMuted` on `surface` ≈ 6.0:1, on `canvas` ≈ 5.4:1; `accentInk` on `accentSoft` ≈ 8.9:1.
 */
export const colors = {
  ink: '#1F2A33', // header bar, primary buttons
  inkPressed: '#33414D',
  onInk: '#FFFFFF',
  text: '#121A21',
  textMuted: '#58636E',
  canvas: '#F2F4F6',
  surface: '#FFFFFF',
  surfaceSunken: '#F7F8FA', // nested replies, skeleton blocks
  border: '#E2E6EA',
  borderStrong: '#8B949E', // form-field outlines: ≥ 3:1 against surface (WCAG 1.4.11)
  accent: '#F5C534', // Mumken yellow
  accentSoft: '#FFF4CC', // avatars, "Published" badge
  accentInk: '#5A4300',
  danger: '#B42318',
  dangerSoft: '#FDEDEC',
  dangerBorder: '#F0A9A3',
  focus: '#1D64D8',
  skeleton: '#E7EAEE',
} as const;

export const space = { xxs: 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;

export const radius = { sm: 6, md: 10, lg: 14, pill: 999 } as const;

export const fontSize = { xs: 12, sm: 14, md: 16, lg: 18, xl: 22, xxl: 28 } as const;

export const lineHeight = { tight: 1.25, normal: 1.5, relaxed: 1.65 } as const;

export const fontWeight = { regular: '400', medium: '500', semibold: '600', bold: '700' } as const;

/** Minimum hit target on touch devices (A-4, P-1/P-2). */
export const touchTarget = 44;

/** Readable line length for the record + discussion column on web. */
export const contentMaxWidth = 880;

export const tokens = { colors, space, radius, fontSize, lineHeight, fontWeight, touchTarget, contentMaxWidth } as const;

const kebab = (value: string) => value.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);

/** Emits `:root { --color-ink: …; --space-md: 12px; … }` for the web app (inlined by the root layout). */
export function tokensToCss(): string {
  const declarations: string[] = [];
  for (const [name, value] of Object.entries(colors)) declarations.push(`--color-${kebab(name)}:${value}`);
  for (const [name, value] of Object.entries(space)) declarations.push(`--space-${name}:${value}px`);
  for (const [name, value] of Object.entries(radius)) declarations.push(`--radius-${name}:${value}px`);
  for (const [name, value] of Object.entries(fontSize)) declarations.push(`--font-size-${name}:${value / 16}rem`);
  for (const [name, value] of Object.entries(lineHeight)) declarations.push(`--line-height-${name}:${value}`);
  declarations.push(`--touch-target:${touchTarget}px`, `--content-max-width:${contentMaxWidth}px`);
  return `:root{${declarations.join(';')}}`;
}
