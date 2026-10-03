// FNV-1a: stable 32-bit hash for seeding.
export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// mulberry32: tiny seeded PRNG returning [0, 1).
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Rand = () => number;
export const int = (rand: Rand, min: number, max: number) =>
  min + Math.floor(rand() * (max - min + 1));
export const pick = <T>(rand: Rand, items: readonly T[]): T =>
  items[Math.floor(rand() * items.length)]!;
