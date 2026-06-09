const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

export function isValidUsername(u: string): boolean {
  return USERNAME_RE.test(u);
}

/**
 * Construit un pseudo suggéré, ex. "satoshi_4f2".
 * @param seed nombre (ex. Date.now()) pour rendre le suffixe unique.
 * @param base base optionnelle (sera nettoyée).
 */
export function suggestUsername(seed: number, base?: string): string {
  const suffix = Math.abs(seed).toString(36).slice(-3) || 'x';
  const cleaned = (base ?? 'mindy')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')   // enlève les accents
    .replace(/[^a-z0-9]/g, '')          // garde alphanum
    .slice(0, 12) || 'mindy';
  return `${cleaned}_${suffix}`;
}
