/**
 * 테마 진입점. 화면/컴포넌트는 항상 여기서 import 한다.
 *   import { colors, fonts, typography, radius, spacing, sizes, shadow, tint } from '../theme';
 */
export { colors, brandPalette, categoryColors, fonts, typography, radius, spacing, sizes, shadow } from './tokens';

import { colors } from './tokens';

/**
 * color-mix(in srgb, hex p%, #fff) 계산 — 원본의 옅은 배경(강조/카테고리 soft)에 사용.
 * 예) tint('#8C5F6E', 8)  → poll 선택 옵션 배경
 *     tint(color, 13)     → 캡슐 reveal 원형 배경 / accentSoft
 */
export function tint(hex: string, percent: number): string {
  const p = Math.max(0, Math.min(100, percent)) / 100;
  const h = hex.replace('#', '');
  const full =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  const mix = (c: number) => Math.round(c * p + 255 * (1 - p));
  const to2 = (n: number) => n.toString(16).padStart(2, '0');
  return `#${to2(mix(r))}${to2(mix(g))}${to2(mix(b))}`;
}

/**
 * color-mix(in srgb, hex, black p%) 계산 — 강조 진하게(accentStrong 류).
 */
export function shade(hex: string, percent: number): string {
  const p = Math.max(0, Math.min(100, percent)) / 100;
  const h = hex.replace('#', '');
  const full =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  const mix = (c: number) => Math.round(c * (1 - p));
  const to2 = (n: number) => n.toString(16).padStart(2, '0');
  return `#${to2(mix(r))}${to2(mix(g))}${to2(mix(b))}`;
}

export const theme = { colors } as const;
