/**
 * PRNG determinístico (mulberry32) usado só pelos dados de demonstração, para que a mesma
 * "empresa fictícia" (clientes, projetos, valores) apareça de forma consistente durante a sessão,
 * sem depender de Math.random() em código que pode ser avaliado tanto no build quanto no cliente.
 */
export function createSeededRandom(seed: number) {
  let state = seed;
  return function next(): number {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickFrom<T>(random: () => number, items: readonly T[]): T {
  return items[Math.floor(random() * items.length)];
}

export function randomInt(random: () => number, min: number, max: number): number {
  return Math.floor(random() * (max - min + 1)) + min;
}

export function randomFloat(random: () => number, min: number, max: number, precision = 2): number {
  const value = random() * (max - min) + min;
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}
