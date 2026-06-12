# Six domaines d'apprentissage — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter 3 domaines (`REAL_ESTATE`/Immobilier, `ENTREPRENEURSHIP`/Entrepreneuriat, `TAXES`/Impôts) aux 3 existants, visibles partout (onboarding 6 choix + catalogue 6 onglets) avec 1 leçon démo jouable chacun.

**Architecture:** Une **source de vérité unique** côté mobile (`src/data/domains.ts`) remplace les ternaires `domaine→couleur/label/icône` hardcodés. Backend : enum Prisma + schémas Zod élargis. Contenu : 3 leçons insérées par un **script idempotent non-destructif**.

**Tech Stack:** Prisma/PostgreSQL (Neon), NestJS, Zod, shared TS, Expo/React Native, Zustand, Jest.

**Spec de référence :** `docs/superpowers/specs/2026-06-12-six-domains-design.md`

---

## Structure des fichiers

**Backend (`server/`)**
- Modify: `prisma/schema.prisma` (enum `Domain`), `src/lessons/lesson-content.schema.ts` (z.enum domaine ×2), `src/auth/auth.controller.ts` (`RegisterSchema.preferredDomain`).
- Create: `src/lessons/demo-domain-lessons.data.ts` (3 leçons), `src/lessons/demo-domain-lessons.spec.ts` (test), `prisma/add-domain-lessons.ts` (script d'insertion idempotent).

**Shared (`shared/`)**
- Modify: `types/lesson.ts` (`Domain`), `types/api.ts` (`CreateUserDto`/`RegisterDto.preferredDomain`). Rebuild `dist`.

**Mobile (`mobile/`)**
- Create: `src/data/domains.ts` (map central `DOMAINS` + `DOMAIN_ORDER`), `__tests__/domains.spec.ts`.
- Modify: `src/components/ui/LessonCard.tsx`, `src/components/ui/ContinueCard.tsx`, `src/api/client.ts` (`getByDomain`), `app/(tabs)/learn.tsx` (onglets 6 domaines), `app/onboarding/steps/DomainStep.tsx`, `app/onboarding/hooks/useOnboardingStore.ts`, `app/settings.tsx`.

> ⚠️ Les leçons démo n'apparaîtront en démo qu'après avoir lancé le script (Task 10) contre Neon — différé comme pour l'auth.

---

## Task 1 : Backend — enum Domain + schémas Zod

**Files:**
- Modify: `server/prisma/schema.prisma:222-226`
- Modify: `server/src/lessons/lesson-content.schema.ts` (les deux `z.enum([...])` de `CreateLessonSchema` et `UpdateLessonSchema`)
- Modify: `server/src/auth/auth.controller.ts` (`RegisterSchema`)

- [ ] **Step 1 : enum Prisma**

Dans `server/prisma/schema.prisma`, remplacer le bloc :
```prisma
enum Domain {
  CRYPTO
  FINANCE
  TRADING
}
```
par :
```prisma
enum Domain {
  CRYPTO
  FINANCE
  TRADING
  REAL_ESTATE
  ENTREPRENEURSHIP
  TAXES
}
```

- [ ] **Step 2 : régénérer le client Prisma (pas de DB)**

Run: `cd server && npx prisma generate`
Expected: « Generated Prisma Client ». (Ne PAS lancer `migrate`/`db push` — l'ajout en prod se fait au build Render.)

- [ ] **Step 3 : z.enum des leçons**

Dans `server/src/lessons/lesson-content.schema.ts`, dans **`CreateLessonSchema`** ET **`UpdateLessonSchema`**, remplacer chaque `domain: z.enum(['CRYPTO', 'FINANCE', 'TRADING'])` (et la variante `.optional()`) par :
```ts
  domain: z.enum(['CRYPTO', 'FINANCE', 'TRADING', 'REAL_ESTATE', 'ENTREPRENEURSHIP', 'TAXES']),
```
(garder le `.optional()` sur celui de `UpdateLessonSchema`).

- [ ] **Step 4 : z.enum du register**

Dans `server/src/auth/auth.controller.ts`, dans `RegisterSchema`, remplacer :
```ts
  preferredDomain: z.enum(['CRYPTO', 'FINANCE', 'BOTH']).optional(),
```
par :
```ts
  preferredDomain: z.enum(['CRYPTO', 'FINANCE', 'TRADING', 'REAL_ESTATE', 'ENTREPRENEURSHIP', 'TAXES', 'BOTH']).optional(),
```

- [ ] **Step 5 : compile + commit**

Run: `cd server && npx tsc --noEmit -p tsconfig.json` → aucune erreur.
```bash
git add server/prisma/schema.prisma server/src/lessons/lesson-content.schema.ts server/src/auth/auth.controller.ts
git commit -m "feat(domains): enum Domain + schémas Zod élargis (3 nouveaux domaines)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2 : Shared — types Domain & preferredDomain

**Files:**
- Modify: `shared/types/lesson.ts:353`
- Modify: `shared/types/api.ts:58-77`

- [ ] **Step 1 : type Domain**

Dans `shared/types/lesson.ts`, remplacer :
```ts
export type Domain = 'CRYPTO' | 'FINANCE' | 'TRADING';
```
par :
```ts
export type Domain = 'CRYPTO' | 'FINANCE' | 'TRADING' | 'REAL_ESTATE' | 'ENTREPRENEURSHIP' | 'TAXES';
```

- [ ] **Step 2 : preferredDomain dans les DTO**

Dans `shared/types/api.ts`, dans `CreateUserDto` ET `RegisterDto`, remplacer la ligne :
```ts
  preferredDomain?: 'CRYPTO' | 'FINANCE' | 'BOTH';
```
par :
```ts
  preferredDomain?: 'CRYPTO' | 'FINANCE' | 'TRADING' | 'REAL_ESTATE' | 'ENTREPRENEURSHIP' | 'TAXES' | 'BOTH';
```

- [ ] **Step 3 : rebuild + vérif**

Run: `cd shared && npm run build`
Verify: `grep -c "REAL_ESTATE" shared/dist/lesson.d.ts` → ≥ 1.

- [ ] **Step 4 : commit**

```bash
git add shared/types shared/dist
git commit -m "feat(shared): Domain + preferredDomain incluent les 3 nouveaux domaines

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3 : Leçons démo (data + test + script idempotent)

**Files:**
- Create: `server/src/lessons/demo-domain-lessons.data.ts`
- Test: `server/src/lessons/demo-domain-lessons.spec.ts`
- Create: `server/prisma/add-domain-lessons.ts`

- [ ] **Step 1 : la data des 3 leçons**

Create `server/src/lessons/demo-domain-lessons.data.ts` :
```ts
import type { CreateLessonInput } from './lesson-content.schema';

/** 3 leçons démo (1 par nouveau domaine). Ids fixes → upsert idempotent. */
export const DEMO_DOMAIN_LESSONS: Array<{ id: string } & CreateLessonInput> = [
  {
    id: 'demo-real-estate-001',
    title: 'Immobilier : acheter ou louer ?',
    domain: 'REAL_ESTATE',
    difficulty: 'BEGINNER',
    xpReward: 75,
    orderIndex: 1,
    content: {
      steps: [
        {
          type: 'info',
          title: 'Acheter ou louer ?',
          content: `Louer ou acheter ton logement, c'est l'une des plus grosses décisions financières de ta vie.\n\nLouer : flexibilité, pas d'apport, mais tu ne te constitues pas de patrimoine.\nAcheter : tu construis un capital, mais il y a des frais importants (frais de notaire ~7-8 % dans l'ancien) et un engagement long.\n\nLa bonne réponse dépend de ta situation : durée, marché local, apport, stabilité.`,
          mindyMessage: "La pierre, ça rassure — mais ça s'étudie. 🏠",
        },
        {
          type: 'quiz',
          question: "Dans l'ancien, les « frais de notaire » représentent environ…",
          options: ['1-2 % du prix', '7-8 % du prix', '15 % du prix', "0 %, c'est gratuit"],
          correctIndex: 1,
          mindyHint: "Ils sont bien plus élevés dans l'ancien que dans le neuf.",
        },
        {
          type: 'swipe',
          statement: 'Acheter est toujours plus rentable que louer.',
          isCorrect: false,
          explanation: "Faux. Sur une courte durée, les frais d'achat (notaire, agence) ne sont pas amortis : louer peut être plus malin. Tout dépend de la durée de détention et du marché.",
        },
      ],
    },
  },
  {
    id: 'demo-entrepreneurship-001',
    title: 'Lancer son business : les bases',
    domain: 'ENTREPRENEURSHIP',
    difficulty: 'BEGINNER',
    xpReward: 75,
    orderIndex: 1,
    content: {
      steps: [
        {
          type: 'info',
          title: 'Lancer son business : les bases',
          content: `Avant de te lancer, une règle d'or : valide le besoin avant de tout construire.\n\nLe MVP (Minimum Viable Product) = la plus petite version de ton produit qui permet de tester si des gens en veulent (et sont prêts à payer).\n\nEt ne l'oublie jamais : un business survit quand ses revenus dépassent ses charges.`,
          mindyMessage: "Pas besoin d'être parfait. Besoin d'être utile. 🚀",
        },
        {
          type: 'quiz',
          question: 'À quoi sert un MVP ?',
          options: ['À avoir un produit parfait dès le départ', "À valider qu'un vrai besoin existe", 'À lever des millions', 'À recruter une grosse équipe'],
          correctIndex: 1,
          mindyHint: 'Minimum… Viable… on teste avant de tout miser.',
        },
        {
          type: 'swipe',
          statement: 'Il faut une idée 100 % originale pour réussir.',
          isCorrect: false,
          explanation: "Faux. La plupart des succès reprennent des idées existantes mieux exécutées. L'exécution et le client comptent plus que l'originalité.",
        },
      ],
    },
  },
  {
    id: 'demo-taxes-001',
    title: 'Comprendre tes impôts',
    domain: 'TAXES',
    difficulty: 'BEGINNER',
    xpReward: 75,
    orderIndex: 1,
    content: {
      steps: [
        {
          type: 'info',
          title: 'Comprendre tes impôts',
          content: `En France, l'impôt sur le revenu est progressif : il est calculé par tranches.\n\nChaque tranche a son taux, et seule la partie de ton revenu qui tombe dans une tranche est taxée à ce taux-là.\n\nÀ retenir aussi : le brut (avant cotisations/impôt) n'est pas le net (ce que tu touches vraiment), et l'impôt est désormais prélevé à la source.`,
          mindyMessage: "Les impôts, c'est moins effrayant quand on comprend les tranches. 🧾",
        },
        {
          type: 'quiz',
          question: "Le barème de l'impôt sur le revenu est…",
          options: ['Un taux unique pour tous', 'Progressif, par tranches', 'Toujours 0 %', "Calculé sur le chiffre d'affaires"],
          correctIndex: 1,
          mindyHint: 'Plus tu gagnes, plus la part supplémentaire est taxée — par paliers.',
        },
        {
          type: 'swipe',
          statement: 'Passer dans la tranche supérieure fait baisser ton revenu net global.',
          isCorrect: false,
          explanation: "Faux. Seule la part au-dessus du seuil est taxée au taux plus élevé : gagner plus ne fait jamais baisser ton net total.",
        },
      ],
    },
  },
];
```

- [ ] **Step 2 : test (valide le contenu + le schéma de création)**

Create `server/src/lessons/demo-domain-lessons.spec.ts` :
```ts
import { CreateLessonSchema, validateLessonContent } from './lesson-content.schema';
import { DEMO_DOMAIN_LESSONS } from './demo-domain-lessons.data';

describe('DEMO_DOMAIN_LESSONS', () => {
  it('contient 1 leçon pour chaque nouveau domaine', () => {
    const domains = DEMO_DOMAIN_LESSONS.map((l) => l.domain).sort();
    expect(domains).toEqual(['ENTREPRENEURSHIP', 'REAL_ESTATE', 'TAXES']);
  });

  it.each(DEMO_DOMAIN_LESSONS)('contenu valide : $title', (lesson) => {
    expect(() => validateLessonContent(lesson.content)).not.toThrow();
  });

  it.each(DEMO_DOMAIN_LESSONS)('passe CreateLessonSchema : $title', (lesson) => {
    const { id, ...input } = lesson;
    expect(CreateLessonSchema.safeParse(input).success).toBe(true);
  });
});
```

- [ ] **Step 3 : run le test → vert**

Run: `cd server && npm test -- demo-domain-lessons`
Expected: tous verts (3 domaines + contenus valides + schéma OK).

- [ ] **Step 4 : le script d'insertion idempotent (NON lancé ici)**

Create `server/prisma/add-domain-lessons.ts` :
```ts
import { PrismaClient } from '@prisma/client';
import { DEMO_DOMAIN_LESSONS } from '../src/lessons/demo-domain-lessons.data';

const prisma = new PrismaClient();

/**
 * Insère/maj les 3 leçons démo des nouveaux domaines.
 * Idempotent (upsert par id fixe) et NON destructif (aucun deleteMany).
 * Lancer une fois contre Neon :  npx ts-node prisma/add-domain-lessons.ts
 */
async function main() {
  for (const lesson of DEMO_DOMAIN_LESSONS) {
    const { id, ...rest } = lesson;
    await prisma.lesson.upsert({
      where: { id },
      create: { id, ...rest, content: rest.content as object },
      update: { ...rest, content: rest.content as object },
    });
    console.log(`[add-domain-lessons] upserted ${id} (${rest.domain})`);
  }
  console.log('[add-domain-lessons] done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
```

- [ ] **Step 5 : vérifier que le script type-checke sans le lancer**

Run: `cd server && npx tsc --noEmit -p tsconfig.json`
Expected: aucune erreur. **Ne PAS exécuter le script** (touche Neon ; lancé en Task 10).

- [ ] **Step 6 : commit**

```bash
git add server/src/lessons/demo-domain-lessons.data.ts server/src/lessons/demo-domain-lessons.spec.ts server/prisma/add-domain-lessons.ts
git commit -m "feat(domains): 3 leçons démo + script d'insertion idempotent + test

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4 : Mobile — config centrale des domaines

**Files:**
- Create: `mobile/src/data/domains.ts`
- Test: `mobile/__tests__/domains.spec.ts`

- [ ] **Step 1 : test d'abord (échoue)**

Create `mobile/__tests__/domains.spec.ts` :
```ts
import { DOMAINS, DOMAIN_ORDER } from '../src/data/domains';

const EXPECTED = ['CRYPTO', 'FINANCE', 'TRADING', 'REAL_ESTATE', 'ENTREPRENEURSHIP', 'TAXES'];

describe('domains config', () => {
  it('DOMAINS couvre exactement les 6 domaines', () => {
    expect(Object.keys(DOMAINS).sort()).toEqual([...EXPECTED].sort());
  });

  it('DOMAIN_ORDER liste les 6 domaines', () => {
    expect([...DOMAIN_ORDER].sort()).toEqual([...EXPECTED].sort());
  });

  it('chaque domaine a label / couleur hex / icône', () => {
    for (const d of DOMAIN_ORDER) {
      expect(DOMAINS[d].label).toBeTruthy();
      expect(DOMAINS[d].color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(DOMAINS[d].icon).toBeTruthy();
    }
  });
});
```

- [ ] **Step 2 : run → échoue (module absent)**

Run: `cd mobile && npm test -- domains`
Expected: FAIL (`Cannot find module '../src/data/domains'`).

- [ ] **Step 3 : créer la config**

Create `mobile/src/data/domains.ts` :
```ts
import type { Domain } from '@mindy/shared';

export interface DomainMeta {
  label: string;
  sublabel: string;
  color: string;
  icon: string;
}

/** Source de vérité unique pour l'affichage des domaines (label, couleur, icône). */
export const DOMAINS: Record<Domain, DomainMeta> = {
  CRYPTO:           { label: 'Crypto',          sublabel: 'Bitcoin, blockchain, DeFi',  color: '#F7931A', icon: '₿' },
  FINANCE:          { label: 'Finance',         sublabel: 'Investir, budget, bourse',    color: '#3FB950', icon: '💰' },
  TRADING:          { label: 'Trading',         sublabel: 'Marchés, bougies, risque',    color: '#58A6FF', icon: '📊' },
  REAL_ESTATE:      { label: 'Immobilier',      sublabel: 'Acheter, louer, investir',    color: '#A371F7', icon: '🏠' },
  ENTREPRENEURSHIP: { label: 'Entrepreneuriat', sublabel: 'Lancer & gérer un business',  color: '#FF7B72', icon: '🚀' },
  TAXES:            { label: 'Impôts',           sublabel: 'Fiscalité, déclarations',     color: '#E3B341', icon: '🧾' },
};

/** Ordre d'affichage des domaines dans l'onboarding et le catalogue. */
export const DOMAIN_ORDER: Domain[] = ['CRYPTO', 'FINANCE', 'TRADING', 'REAL_ESTATE', 'ENTREPRENEURSHIP', 'TAXES'];
```

- [ ] **Step 4 : run → vert + tsc**

Run: `cd mobile && npm test -- domains` → vert. Puis `cd mobile && npx tsc --noEmit` → propre.

- [ ] **Step 5 : commit**

```bash
git add mobile/src/data/domains.ts mobile/__tests__/domains.spec.ts
git commit -m "feat(domains): config mobile centrale DOMAINS + DOMAIN_ORDER (6 domaines)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5 : Mobile — cartes de leçon & client utilisent DOMAINS

**Files:**
- Modify: `mobile/src/components/ui/LessonCard.tsx:13,49`
- Modify: `mobile/src/components/ui/ContinueCard.tsx:22,83`
- Modify: `mobile/src/api/client.ts:233`

- [ ] **Step 1 : LessonCard**

Dans `mobile/src/components/ui/LessonCard.tsx` :
- En haut, ajouter : `import { DOMAINS } from '@/data/domains';` et `import type { Domain } from '@mindy/shared';`
- Remplacer le type du prop `domain: 'CRYPTO' | 'FINANCE';` par `domain: Domain;`
- Remplacer `const domainColor = domain === 'CRYPTO' ? '#39FF14' : '#58A6FF';` par :
  ```ts
  const domainColor = DOMAINS[domain].color;
  ```
- Là où le badge affiche `{domain}` (texte brut du token), remplacer par le label lisible : `{DOMAINS[domain].label}` (et, si pertinent, préfixer `{DOMAINS[domain].icon} `).

- [ ] **Step 2 : ContinueCard**

Dans `mobile/src/components/ui/ContinueCard.tsx` : mêmes changements —
- `import { DOMAINS } from '@/data/domains';` + `import type { Domain } from '@mindy/shared';`
- prop `domain: 'CRYPTO' | 'FINANCE';` → `domain: Domain;`
- `const domainColor = domain === 'CRYPTO' ? '#39FF14' : '#58A6FF';` → `const domainColor = DOMAINS[domain].color;`
- Le texte du badge domaine → `{DOMAINS[domain].label}`.

- [ ] **Step 3 : client getByDomain**

Dans `mobile/src/api/client.ts`, ajouter `import type { ... , Domain } from '@mindy/shared';` (ajouter `Domain` au bloc d'import de types existant) et remplacer :
```ts
  getByDomain: (domain: 'CRYPTO' | 'FINANCE', userId?: string) => {
```
par :
```ts
  getByDomain: (domain: Domain, userId?: string) => {
```

- [ ] **Step 4 : tsc + tests + commit**

Run: `cd mobile && npx tsc --noEmit` → propre ; `cd mobile && npm test` → vert.
```bash
git add mobile/src/components/ui/LessonCard.tsx mobile/src/components/ui/ContinueCard.tsx mobile/src/api/client.ts
git commit -m "refactor(domains): LessonCard/ContinueCard/client utilisent DOMAINS (type élargi)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6 : Mobile — onglet Apprendre à 6 domaines (la grosse tâche)

**Files:**
- Modify: `mobile/app/(tabs)/learn.tsx`

> Contexte : le fichier a aujourd'hui **3 onglets hardcodés** (≈ lignes 720-755) avec des styles `tabActiveCrypto/Trading/Finance`, **3 mémos de nœuds** (`cryptoNodes`/`financeNodes`/`tradingNodes`) et des **ternaires** `selectedDomain === 'CRYPTO' ? … : …` (couleur ≈ 616-617, `activeNodes` ≈ 609-610, master-quiz ≈ 587-588). On généralise aux 6 domaines via `DOMAINS`/`DOMAIN_ORDER`. **Lis le fichier en entier d'abord.**

- [ ] **Step 1 : imports + type Domain**

En haut de `mobile/app/(tabs)/learn.tsx` :
- Ajouter : `import { DOMAINS, DOMAIN_ORDER } from '@/data/domains';`
- Remplacer le type local `type Domain = 'CRYPTO' | 'FINANCE' | 'TRADING';` par un import : `import type { Domain } from '@mindy/shared';` (supprimer la déclaration locale, garder l'usage).

- [ ] **Step 2 : nœuds par domaine génériques**

Remplacer les **3 mémos séparés** `cryptoNodes` / `financeNodes` / `tradingNodes` par un seul mémo calculé pour le domaine sélectionné, plus un comptage par domaine pour les pastilles d'onglets :
```ts
  const activeNodes = useMemo(() => getDomainNodes(selectedDomain), [getDomainNodes, selectedDomain]);

  const lessonCountByDomain = useMemo(() => {
    const counts = {} as Record<Domain, number>;
    for (const d of DOMAIN_ORDER) counts[d] = getDomainNodes(d).length;
    return counts;
  }, [getDomainNodes]);
```
Puis remplacer **toutes** les utilisations de `cryptoNodes`/`financeNodes`/`tradingNodes` et les ternaires `selectedDomain === 'CRYPTO' ? cryptoNodes : …` par `activeNodes`. Dans l'effet « master quiz » (≈ 587-606), utiliser `activeNodes` au lieu de la sélection ternaire, et garder `selectedDomain` dans le tableau de dépendances (retirer les anciens `cryptoNodes`/etc.).

- [ ] **Step 3 : couleur active depuis DOMAINS**

Remplacer le ternaire de couleur (≈ 616-617) :
```ts
  const domainColor =
    selectedDomain === 'CRYPTO' ? '#39FF14'
    : selectedDomain === 'TRADING' ? '#FF8C00'
    : '#58A6FF';
```
par :
```ts
  const domainColor = DOMAINS[selectedDomain].color;
```

- [ ] **Step 4 : barre d'onglets générée (6 domaines)**

Remplacer le bloc des **3 onglets hardcodés** (le conteneur qui rend les `<Pressable>`/`<TouchableOpacity>` Crypto/Trading/Finance, ≈ lignes 720-755) par une génération sur `DOMAIN_ORDER`. Le sélecteur doit être **horizontalement défilable** (6 onglets) :
```tsx
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsRow}
        >
          {DOMAIN_ORDER.map((d) => {
            const active = selectedDomain === d;
            const color = DOMAINS[d].color;
            return (
              <TouchableOpacity
                key={d}
                onPress={() => handleSelectDomain(d)}
                activeOpacity={0.8}
                style={[styles.tab, active && { borderColor: color, backgroundColor: color + '20' }]}
              >
                <Text style={[styles.tabText, active && { color }]}>
                  {DOMAINS[d].icon} {DOMAINS[d].label}
                </Text>
                <Text style={[styles.tabCount, active && { color }]}>
                  {lessonCountByDomain[d] ?? 0}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
```
- `handleSelectDomain` = la fonction existante appelée à la sélection (celle autour de la ligne 621-624 : `if (domain === selectedDomain) return; … setSelectedDomain(domain);`). Réutilise-la (renomme si besoin pour qu'elle prenne un `Domain`).
- Si `ScrollView` / `TouchableOpacity` ne sont pas déjà importés depuis `react-native` en haut du fichier, les ajouter à l'import.
- Supprimer les styles devenus inutiles `tabActiveCrypto`/`tabActiveTrading`/`tabActiveFinance` et `tabTextActiveCrypto`/etc. Conserver/ajouter des styles génériques `tab`, `tabText`, `tabCount`, `tabsRow` (réutiliser les valeurs existantes de `tab`/`tabText`/`tabCount` ; ajouter `tabsRow: { gap: 8, paddingHorizontal: 16 }` si absent).

- [ ] **Step 5 : compile + tests + lancer l'app mentalement**

Run: `cd mobile && npx tsc --noEmit` → aucune erreur (plus aucune référence à `cryptoNodes`/`financeNodes`/`tradingNodes` ni aux styles supprimés : `grep -nE "cryptoNodes|financeNodes|tradingNodes|tabActiveCrypto" mobile/app/\(tabs\)/learn.tsx` doit être vide).
Run: `cd mobile && npm test` → vert.

- [ ] **Step 6 : commit**

```bash
git add "mobile/app/(tabs)/learn.tsx"
git commit -m "feat(domains): onglet Apprendre à 6 domaines (sélecteur défilable, DOMAINS)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 7 : Mobile — onboarding aux 6 domaines

**Files:**
- Modify: `mobile/app/onboarding/hooks/useOnboardingStore.ts:17`
- Modify: `mobile/app/onboarding/steps/DomainStep.tsx`

- [ ] **Step 1 : élargir le type Domain du store**

Dans `mobile/app/onboarding/hooks/useOnboardingStore.ts`, remplacer :
```ts
export type Domain = 'CRYPTO' | 'FINANCE' | 'BOTH';
```
par :
```ts
export type Domain =
  | 'CRYPTO' | 'FINANCE' | 'TRADING'
  | 'REAL_ESTATE' | 'ENTREPRENEURSHIP' | 'TAXES'
  | 'BOTH';
```
(Le `'BOTH'` = méta-choix « un peu de tout ».)

- [ ] **Step 2 : DomainStep propose 6 + « Un peu de tout »**

Remplacer le contenu de `mobile/app/onboarding/steps/DomainStep.tsx` par :
```tsx
import React, { useEffect } from 'react';
import { MindyTurn } from '../components/MindyTurn';
import { AnswerCards } from '../components/AnswerCards';
import { useOnboardingStore, Domain } from '../hooks/useOnboardingStore';
import { DOMAINS, DOMAIN_ORDER } from '@/data/domains';

const OPTIONS = [
  ...DOMAIN_ORDER.map((d) => ({
    id: d,
    label: DOMAINS[d].label,
    sublabel: DOMAINS[d].sublabel,
    icon: DOMAINS[d].icon,
  })),
  { id: 'BOTH', label: 'Un peu de tout', sublabel: 'Pourquoi choisir ?', icon: '✨' },
];

export function DomainStep() {
  const next = useOnboardingStore((s) => s.next);
  const domain = useOnboardingStore((s) => s.domain);
  const setDomain = useOnboardingStore((s) => s.setDomain);
  const setMood = useOnboardingStore((s) => s.setMood);
  useEffect(() => { setMood('neutral'); }, [setMood]);

  return (
    <MindyTurn
      turnKey="domain"
      mood="neutral"
      message="Tu veux apprendre quoi en premier ?"
      ctaLabel="Continuer"
      ctaDisabled={!domain}
      onCta={next}
    >
      <AnswerCards options={OPTIONS} selectedId={domain} onSelect={(id) => setDomain(id as Domain)} />
    </MindyTurn>
  );
}
```

- [ ] **Step 3 : tsc + tests**

Run: `cd mobile && npx tsc --noEmit` → propre. `cd mobile && npm test` → vert (notamment `finalizeOnboarding` : `state.domain` peut maintenant valoir un des 6 ou `BOTH`, accepté par le register).

- [ ] **Step 4 : commit**

```bash
git add mobile/app/onboarding/hooks/useOnboardingStore.ts mobile/app/onboarding/steps/DomainStep.tsx
git commit -m "feat(domains): onboarding propose les 6 domaines (+ 'Un peu de tout')

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 8 : Mobile — Réglages cohérents (6 domaines)

**Files:**
- Modify: `mobile/app/settings.tsx:28-42`

- [ ] **Step 1 : construire DOMAIN_OPTIONS depuis DOMAINS**

Dans `mobile/app/settings.tsx`, ajouter `import { DOMAINS, DOMAIN_ORDER } from '@/data/domains';` puis remplacer le tableau `DOMAIN_OPTIONS` hardcodé (≈ lignes 28-41) par une version dérivée + l'option « Un peu de tout » :
```ts
const DOMAIN_OPTIONS = [
  ...DOMAIN_ORDER.map((d) => ({
    value: d,
    label: DOMAINS[d].label,
    emoji: DOMAINS[d].icon,
    color: DOMAINS[d].color,
  })),
  { value: 'BOTH', label: 'Un peu de tout', emoji: '✨', color: '#8B949E' },
];
```
Conserver le type `DomainValue` (il inclut déjà `TRADING`/`BOTH`) — l'élargir si TypeScript le réclame :
```ts
type DomainValue = 'CRYPTO' | 'FINANCE' | 'TRADING' | 'REAL_ESTATE' | 'ENTREPRENEURSHIP' | 'TAXES' | 'BOTH';
```

- [ ] **Step 2 : tsc + tests + commit**

Run: `cd mobile && npx tsc --noEmit` → propre ; `cd mobile && npm test` → vert.
```bash
git add mobile/app/settings.tsx
git commit -m "feat(domains): Réglages listent les 6 domaines (depuis DOMAINS)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 9 : Vérification complète

- [ ] **Step 1 : backend**

Run: `cd server && npm test && npx tsc --noEmit -p tsconfig.json`
Expected: toutes les suites vertes (dont `demo-domain-lessons`), tsc propre.

- [ ] **Step 2 : mobile**

Run: `cd mobile && npm test && npx tsc --noEmit`
Expected: toutes les suites vertes (dont `domains`), tsc propre.

- [ ] **Step 3 : aucun ternaire de domaine résiduel**

Run: `grep -rnE "=== 'CRYPTO' \?|domain === 'CRYPTO'" mobile/src mobile/app | grep -viE "node_modules"`
Expected: plus aucun mapping couleur/label hardcodé par ternaire dans les composants modifiés (les comparaisons logiques restantes — ex. `=== 'BOTH'` — sont OK). Corriger les résidus oubliés.

> Si une suite casse, la réparer avant de continuer (utiliser superpowers:systematic-debugging si non évident).

---

## Task 10 : Déploiement & contenu (manuel)

- [ ] **Step 1 : déployer le code**
Merge sur `main` → Render rebuild (`prisma db push` ajoute `REAL_ESTATE`/`ENTREPRENEURSHIP`/`TAXES` à l'enum — additif/sûr) + OTA EAS publie le mobile. (Vérifier que `JWT_SECRET` est toujours présent côté Render.)

- [ ] **Step 2 : insérer les 3 leçons démo dans Neon (une fois)**
Run: `cd server && npx ts-node prisma/add-domain-lessons.ts`
Expected: « upserted demo-real-estate-001 (REAL_ESTATE) » … « done. ». Non destructif, ré-exécutable. (Nécessite `DATABASE_URL` pointant sur Neon dans l'environnement.)

- [ ] **Step 3 : vérif manuelle**
- Onboarding → l'étape « Tu veux apprendre quoi en premier ? » affiche **6 domaines + « Un peu de tout »**.
- Onglet **Apprendre** → 6 onglets colorés défilables ; ouvrir Immobilier / Entrepreneuriat / Impôts → la leçon démo se joue (info → quiz → swipe).
- Réglages → le sélecteur de domaine liste les 6.

---

## Self-Review (fait pendant la planification)

- **Couverture spec :** §3.1 backend→T1 ; §3.2 shared→T2 ; §3.4 contenu→T3 ; §3.3 `domains.ts`→T4, cartes/client→T5, learn tab→T6, onboarding+store→T7, settings→T8 ; §5 déploiement→T10 ; §6 tests→T3,T4,T9. Tous les points de la spec ont une tâche.
- **Cohérence des types :** tokens `REAL_ESTATE`/`ENTREPRENEURSHIP`/`TAXES` identiques de la spec au plan (Prisma, Zod ×3, shared `Domain`, `preferredDomain`, `DOMAINS`/`DOMAIN_ORDER`). `DOMAINS: Record<Domain, …>` exige les 6 clés → cohérent avec le `Domain` élargi (T2 avant T4). `getDomainNodes`/`activeNodes`/`lessonCountByDomain` cohérents dans T6.
- **Placeholders :** aucun — code complet à chaque étape (les éditions de `learn.tsx` fournissent le nouveau code + instructions de retrait précises, le fichier étant volumineux).
