/** Lightens (positive amount) or darkens (negative amount) a hex color by a percentage (-100..100). */
export function shadeColor(hex: string, amount: number): string {
  const clean = hex.replace('#', '');
  const num = parseInt(clean.length === 3 ? clean.replace(/./g, (c) => c + c) : clean, 16);
  const factor = amount / 100;

  const channel = (shift: number) => {
    const value = (num >> shift) & 0xff;
    const adjusted = factor >= 0 ? value + (255 - value) * factor : value * (1 + factor);
    return Math.max(0, Math.min(255, Math.round(adjusted)));
  };

  const r = channel(16);
  const g = channel(8);
  const b = channel(0);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}
