/**
 * Design tokens — the single source for web CSS variables and React Native styles.
 *
 * Values come from the Figma reference: the brand hex codes supplied with it (#1C2933, #FFF5D6, #B82424,
 * #FFEBEB) and pixel measurements of the exported frames for the neutrals (screens rendered at 1.0713×).
 * WCAG notes (A-4): `textMuted` on `surface` ≈ 5.2:1, `danger` on `dangerSoft` ≈ 5.5:1. The design's field
 * outline (`borderField`) is ~1.3:1 against white, below WCAG 1.4.11's 3:1 for component boundaries. It is
 * kept to match the design, fields get a strong 2px focus outline, and it is listed as a design-review note.
 */
export const colors = {
  ink: '#1C2933', // header bar, primary buttons, primary text
  inkPressed: '#2E3D49',
  onInk: '#FFFFFF',
  text: '#1C2933',
  textMuted: '#656E77',
  canvas: '#F8FAFA', // page background
  surface: '#FFFFFF', // cards
  surfaceSunken: '#F8FAFA', // nested replies, state cards
  border: '#E2E5E8', // cards, dividers
  borderField: '#DEE0E3', // text fields, outlined buttons
  accentSoft: '#FFF5D6', // avatars, status badge
  accentInk: '#1C2933',
  danger: '#B82424',
  dangerSoft: '#FFEBEB',
  focus: '#1D64D8',
  skeleton: '#DEE0E3',
} as const;

export const space = { xxs: 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;

export const radius = { sm: 6, md: 8, lg: 10, pill: 999 } as const;

export const fontSize = { xs: 12, sm: 13, md: 14, lg: 15, xl: 17, xxl: 20, xxxl: 22, display: 26 } as const;

export const lineHeight = { tight: 1.25, normal: 1.5, relaxed: 1.65 } as const;

export const fontWeight = { regular: '400', medium: '500', semibold: '600', bold: '700' } as const;

/** Minimum hit target on touch devices (A-4, P-1/P-2). */
export const touchTarget = 44;

/** Width of the record + discussion column on web (Figma web frame: 72px inset, 1109px column). */
export const contentMaxWidth = 1109;

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
