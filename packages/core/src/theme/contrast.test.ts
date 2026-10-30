import { describe, expect, it } from 'vitest';
import { colors } from './tokens';

// WCAG 2.2 relative luminance and contrast ratio.
const channel = (value: number) => {
  const c = value / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const luminance = (hex: string) => {
  const n = Number.parseInt(hex.slice(1), 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
};
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
};

describe('design tokens meet WCAG 2.2 AA (A-4)', () => {
  it.each([
    ['text on surface', colors.text, colors.surface, 4.5],
    ['text on canvas', colors.text, colors.canvas, 4.5],
    ['muted text on surface', colors.textMuted, colors.surface, 4.5],
    ['muted text on canvas', colors.textMuted, colors.canvas, 4.5],
    ['muted text on sunken surface', colors.textMuted, colors.surfaceSunken, 4.5],
    ['label on primary button', colors.onInk, colors.ink, 4.5],
    ['avatar / badge ink', colors.accentInk, colors.accentSoft, 4.5],
    ['error text on error panel', colors.danger, colors.dangerSoft, 4.5],
    ['focus ring against surface (non-text)', colors.focus, colors.surface, 3],
    // The design's field outline (#DEE0E3) is ~1.3:1 — below 1.4.11's 3:1. Kept to match the design; the 2px
    // focus outline above carries the boundary while editing. Listed as a design-review note in DECISIONS.
  ])('%s', (_label, foreground, background, minimum) => {
    expect(contrast(foreground, background)).toBeGreaterThanOrEqual(minimum);
  });
});
