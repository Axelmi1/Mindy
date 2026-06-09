# Refonte de l'onboarding Mindy — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Recoder l'onboarding mobile de Mindy en une conversation « Mindy te coache » (9 écrans, mascotte persistante, terminal-style) tout en corrigeant les bugs de finalisation.

**Architecture:** Coquille conversationnelle persistante dans `onboarding/_layout.tsx` (mascotte + progress bar qui ne re-fade pas), un composant `MindyTurn` qui structure chaque écran (mood + message + réponses + bouton), un store Zustand étendu (9 étapes + champ `level`), et une fonction `finalizeOnboarding` unique et idempotente. Zéro changement backend.

**Tech Stack:** Expo 54, React Native 0.81, expo-router v6, react-native-reanimated 4, react-native-svg, expo-notifications, expo-haptics, Zustand 5 (+persist AsyncStorage), Jest (ts-jest, env `node` — tests de logique pure uniquement).

---

## Notes transversales (à lire avant de commencer)

- **Répertoire de travail :** tout le code est sous `mobile/`. Les commandes `npx jest` / `npx tsc` se lancent depuis `mobile/`.
- **Tests :** Jest tourne en environnement `node` (`mobile/jest.config.js`), il **ne peut pas** monter de composants React Native. On teste donc uniquement la **logique pure** (`*.spec.ts`). Les composants UI sont vérifiés manuellement sur device (Expo Go) à la dernière tâche.
- **Lancer un seul test :** `npx jest chemin/du/fichier.spec.ts`
- **Type-check :** `npx tsc --noEmit -p tsconfig.json` (à lancer avant chaque commit UI, puisque les composants ne sont pas couverts par Jest).
- **Gotchas projet (mémoire) :** utiliser `TouchableOpacity` + styles statiques (jamais `Pressable` + style-fonction) ; ne pas ajouter de `SafeAreaProvider`.
- **Palette :** bg `#0D1117`, surface `#161B22`, bordure `#30363D`, vert `#39FF14`, bleu `#58A6FF`, orange `#F78166`, rouge `#F85149`, texte `#E6EDF3`, texte atténué `#8B949E`. Polices : `Inter` (texte), `JetBrainsMono` (mono).
- **Branche :** on est déjà sur `feat/onboarding-redesign`.
- **Affinage vs spec :** le pseudo est *saisi* à l'écran 8 (Signup), mais l'appel réel à `finalizeOnboarding` (création du compte) est *déclenché* à l'écran 9 (Plan), après le choix de notif — un seul finalize idempotent en fin de parcours. C'est plus simple et plus robuste que de scinder création (8) et prefs/notif (9), tout en restant « après l'accroche émotionnelle ».

---

## Cartographie des fichiers

**Créés :**
- `app/onboarding/components/MindyTurn.tsx` — structure commune d'un écran (mood + message + slot réponses + bouton).
- `app/onboarding/components/AnswerCards.tsx` — cartes de choix réutilisables (niveau/domaine/objectif/temps).
- `app/onboarding/components/XpReveal.tsx` — confetti + compteur XP + barre de niveau (étape 7).
- `app/onboarding/components/PlanBuilder.tsx` — animation « Mindy génère ton plan » (étape 9).
- `app/onboarding/hooks/finalizeOnboarding.ts` — création user idempotente + prefs + push + magic-link (remplace `finalize.ts`).
- `app/onboarding/hooks/finalizeOnboarding.spec.ts` — tests logique de finalisation.
- `app/onboarding/data/selectDemoQuestions.ts` — sélection des 3 questions selon domaine + niveau.
- `app/onboarding/data/selectDemoQuestions.spec.ts` — tests de sélection.
- `app/onboarding/lib/usernameSuggest.ts` — génération d'un pseudo suggéré.
- `app/onboarding/lib/usernameSuggest.spec.ts` — tests.
- `app/onboarding/steps/HelloStep.tsx`, `LevelStep.tsx`, `ResultStep.tsx`, `PlanStep.tsx` (nouveaux écrans).

**Modifiés :**
- `app/onboarding/hooks/useOnboardingStore.ts` — `level`, nouveau `STEP_ORDER` (9 étapes).
- `app/onboarding/hooks/useOnboardingStore.spec.ts` — tests des nouvelles étapes/champs.
- `app/onboarding/index.tsx` — routeur des 9 nouvelles étapes.
- `app/onboarding/_layout.tsx` — coquille persistante (mascotte + progress).
- `app/onboarding/data/demoQuestions.ts` — banque enrichie avec niveaux.
- `app/onboarding/steps/DomainStep.tsx`, `GoalStep.tsx`, `TimeStep.tsx`, `DemoQuestionStep.tsx` — réécrits via `MindyTurn`.
- `src/hooks/useUser.ts` — `initUser` ne crée plus de user pendant l'onboarding.

**Supprimés (en fin de parcours) :**
- `app/onboarding/steps/WelcomeStep.tsx`, `MindyIntroStep.tsx`, `DemoIntroStep.tsx`, `ResultsStep.tsx`, `SignupStep.tsx`, `NotificationsStep.tsx` (remplacés).
- `app/onboarding/hooks/finalize.ts` (remplacé par `finalizeOnboarding.ts`).
- `app/onboarding/hooks/useDemoQuestions.ts` (remplacé par `selectDemoQuestions.ts`).
- `app/onboarding/components/OnboardingScreen.tsx` (remplacé par `MindyTurn`).

---

# PHASE 0 — Logique & robustesse (TDD)

Ces tâches sont testables en `node`, indépendantes de l'UI, et portent le plus de valeur (corrections de bugs). On les fait en premier.

## Task 1 : Étendre le store (niveau + 9 étapes)

**Files:**
- Modify: `app/onboarding/hooks/useOnboardingStore.ts`
- Test: `app/onboarding/hooks/useOnboardingStore.spec.ts`

- [ ] **Step 1 : Écrire le test qui échoue**

Remplacer le contenu de `app/onboarding/hooks/useOnboardingStore.spec.ts` par :

```ts
import { useOnboardingStore, STEP_ORDER, getStepProgress, StepId } from './useOnboardingStore';

const reset = () => useOnboardingStore.getState().reset();

describe('useOnboardingStore', () => {
  beforeEach(reset);

  it('STEP_ORDER contient les 9 nouvelles étapes dans l’ordre', () => {
    expect(STEP_ORDER).toEqual([
      'hello', 'level', 'domain', 'goal', 'time',
      'demo', 'result', 'signup', 'plan',
    ]);
  });

  it('démarre sur hello', () => {
    expect(useOnboardingStore.getState().currentStep).toBe('hello');
  });

  it('next() avance, back() recule, et ne dépasse pas les bornes', () => {
    const { next, back } = useOnboardingStore.getState();
    next(); expect(useOnboardingStore.getState().currentStep).toBe('level');
    back(); expect(useOnboardingStore.getState().currentStep).toBe('hello');
    back(); expect(useOnboardingStore.getState().currentStep).toBe('hello'); // borne basse
  });

  it('setLevel stocke le niveau', () => {
    useOnboardingStore.getState().setLevel('intermediate');
    expect(useOnboardingStore.getState().level).toBe('intermediate');
  });

  it('recordDemoAnswer incrémente le score sur bonne réponse', () => {
    const { recordDemoAnswer } = useOnboardingStore.getState();
    recordDemoAnswer('q1', true);
    recordDemoAnswer('q2', false);
    const s = useOnboardingStore.getState();
    expect(s.demoScore).toBe(1);
    expect(s.demoAnswers).toHaveLength(2);
  });

  it('getStepProgress renvoie 100% sur la dernière étape', () => {
    expect(getStepProgress('plan')).toBe(100);
    expect(getStepProgress('hello')).toBeCloseTo((1 / 9) * 100);
  });

  it('reset remet currentStep à hello et vide les réponses', () => {
    const st = useOnboardingStore.getState();
    st.setLevel('advanced'); st.recordDemoAnswer('q', true); st.next();
    st.reset();
    const s = useOnboardingStore.getState();
    expect(s.currentStep).toBe('hello');
    expect(s.level).toBeNull();
    expect(s.demoAnswers).toHaveLength(0);
  });
});
```

- [ ] **Step 2 : Lancer le test (doit échouer)**

Run: `npx jest app/onboarding/hooks/useOnboardingStore.spec.ts`
Expected: FAIL (types `hello`/`level` inconnus, `setLevel` absent).

- [ ] **Step 3 : Mettre à jour le store**

Dans `app/onboarding/hooks/useOnboardingStore.ts`, remplacer le bloc types/STEP_ORDER (lignes 5-16) par :

```ts
export type StepId =
  | 'hello' | 'level' | 'domain' | 'goal' | 'time'
  | 'demo' | 'result' | 'signup' | 'plan';

export const STEP_ORDER: StepId[] = [
  'hello', 'level', 'domain', 'goal', 'time',
  'demo', 'result', 'signup', 'plan',
];

export type Level = 'beginner' | 'intermediate' | 'advanced';
```

Dans `interface OnboardingState`, ajouter après `currentStep: StepId;` :

```ts
  level: Level | null;
```

et dans la liste des actions, après `setDailyMinutes` :

```ts
  setLevel: (l: Level) => void;
```

Dans `initialState`, après `currentStep: 'welcome' as StepId,` → remplacer par `currentStep: 'hello' as StepId,` et ajouter `level: null,`.

Dans le créateur du store, après `setDailyMinutes: ...,` ajouter :

```ts
      setLevel: (level) => set({ level }),
```

- [ ] **Step 4 : Lancer le test (doit passer)**

Run: `npx jest app/onboarding/hooks/useOnboardingStore.spec.ts`
Expected: PASS.

- [ ] **Step 5 : Commit**

```bash
git add app/onboarding/hooks/useOnboardingStore.ts app/onboarding/hooks/useOnboardingStore.spec.ts
git commit -m "feat(onboarding): store 9 étapes + champ level"
```

---

## Task 2 : Banque de questions enrichie par niveau

**Files:**
- Modify: `app/onboarding/data/demoQuestions.ts`
- Test: `app/onboarding/data/demoQuestions.spec.ts` (déjà existant — on l'adapte)

But : chaque question gagne un champ `difficulty` pour permettre la sélection par niveau (Task 3). On garde les questions existantes et on en ajoute pour avoir un pool sélectionnable.

- [ ] **Step 1 : Adapter le test existant**

Remplacer `app/onboarding/data/demoQuestions.spec.ts` par :

```ts
import { demoQuestions, DemoQuestion } from './demoQuestions';

const all = (): DemoQuestion[] => [
  ...demoQuestions.CRYPTO, ...demoQuestions.FINANCE, ...demoQuestions.BOTH,
];

describe('demoQuestions', () => {
  it.each(['CRYPTO', 'FINANCE', 'BOTH'] as const)(
    '%s a au moins 3 questions (pool sélectionnable)',
    (domain) => { expect(demoQuestions[domain].length).toBeGreaterThanOrEqual(3); },
  );

  it('chaque question a une difficulté valide', () => {
    for (const q of all()) {
      expect(['beginner', 'intermediate', 'advanced']).toContain(q.difficulty);
    }
  });

  it('chaque domaine couvre les 3 difficultés', () => {
    for (const domain of ['CRYPTO', 'FINANCE', 'BOTH'] as const) {
      const diffs = new Set(demoQuestions[domain].map((q) => q.difficulty));
      expect(diffs.has('beginner')).toBe(true);
      expect(diffs.has('intermediate')).toBe(true);
      expect(diffs.has('advanced')).toBe(true);
    }
  });

  it('les questions image_choice/choice ont exactement une bonne option', () => {
    for (const q of all()) {
      if (q.type === 'image_choice' || q.type === 'choice') {
        expect(q.options.filter((o) => o.isCorrect).length).toBe(1);
      }
    }
  });
});
```

- [ ] **Step 2 : Lancer le test (doit échouer)**

Run: `npx jest app/onboarding/data/demoQuestions.spec.ts`
Expected: FAIL (`difficulty` absent ; pools insuffisants).

- [ ] **Step 3 : Réécrire `demoQuestions.ts`**

Remplacer intégralement `app/onboarding/data/demoQuestions.ts` par :

```ts
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

type Base = { id: string; question: string; explanation: string; difficulty: Difficulty };

export type DemoQuestion =
  | (Base & { type: 'image_choice'; options: { id: string; label: string; isCorrect: boolean }[] })
  | (Base & { type: 'true_false'; correctAnswer: boolean })
  | (Base & { type: 'choice'; options: { id: string; label: string; isCorrect: boolean }[] });

export type Domain = 'CRYPTO' | 'FINANCE' | 'BOTH';

const CRYPTO: DemoQuestion[] = [
  {
    id: 'crypto-b1', type: 'image_choice', difficulty: 'beginner',
    question: 'Which one is Bitcoin?',
    options: [
      { id: 'btc', label: '₿', isCorrect: true },
      { id: 'eth', label: 'Ξ', isCorrect: false },
      { id: 'dollar', label: '$', isCorrect: false },
    ],
    explanation: '₿ is the symbol for Bitcoin.',
  },
  {
    id: 'crypto-b2', type: 'true_false', difficulty: 'beginner',
    question: '"HODL" means to hold your crypto long-term',
    correctAnswer: true,
    explanation: 'HODL originated from a typo of "HOLD" and became crypto slang.',
  },
  {
    id: 'crypto-i1', type: 'choice', difficulty: 'intermediate',
    question: 'What happens when you "buy the dip"?',
    options: [
      { id: 'a', label: 'Buy when price drops', isCorrect: true },
      { id: 'b', label: 'Sell everything', isCorrect: false },
      { id: 'c', label: 'Buy a snack', isCorrect: false },
    ],
    explanation: '"Buy the dip" means purchasing when prices drop.',
  },
  {
    id: 'crypto-i2', type: 'true_false', difficulty: 'intermediate',
    question: 'A blockchain is a public, shared ledger',
    correctAnswer: true,
    explanation: 'A blockchain records transactions on a distributed, public ledger.',
  },
  {
    id: 'crypto-a1', type: 'choice', difficulty: 'advanced',
    question: 'What is a "private key" used for?',
    options: [
      { id: 'a', label: 'Signing & controlling your funds', isCorrect: true },
      { id: 'b', label: 'Logging into exchanges only', isCorrect: false },
      { id: 'c', label: 'Mining new coins', isCorrect: false },
    ],
    explanation: 'Your private key signs transactions — whoever holds it controls the funds.',
  },
];

const FINANCE: DemoQuestion[] = [
  {
    id: 'finance-b1', type: 'image_choice', difficulty: 'beginner',
    question: 'Which symbol is the Euro?',
    options: [
      { id: 'eur', label: '€', isCorrect: true },
      { id: 'gbp', label: '£', isCorrect: false },
      { id: 'yen', label: '¥', isCorrect: false },
    ],
    explanation: '€ is the symbol of the Euro, used by 20+ countries.',
  },
  {
    id: 'finance-b2', type: 'true_false', difficulty: 'beginner',
    question: 'A "bull market" means prices are going down',
    correctAnswer: false,
    explanation: 'A bull market is when prices are rising — a bear market is falling.',
  },
  {
    id: 'finance-i1', type: 'choice', difficulty: 'intermediate',
    question: 'What is compound interest?',
    options: [
      { id: 'a', label: 'Interest on your interest', isCorrect: true },
      { id: 'b', label: 'A bank tax', isCorrect: false },
      { id: 'c', label: 'A type of loan', isCorrect: false },
    ],
    explanation: 'Compound interest earns you interest on your previous interest.',
  },
  {
    id: 'finance-i2', type: 'true_false', difficulty: 'intermediate',
    question: 'Diversifying spreads your risk across assets',
    correctAnswer: true,
    explanation: 'Diversification reduces the impact of any single asset falling.',
  },
  {
    id: 'finance-a1', type: 'choice', difficulty: 'advanced',
    question: 'What does inflation do to cash sitting idle?',
    options: [
      { id: 'a', label: 'Erodes its purchasing power', isCorrect: true },
      { id: 'b', label: 'Increases its value', isCorrect: false },
      { id: 'c', label: 'Nothing at all', isCorrect: false },
    ],
    explanation: 'Inflation means each euro buys less over time, so idle cash loses value.',
  },
];

const BOTH: DemoQuestion[] = [
  CRYPTO[0],          // beginner
  FINANCE[2],         // intermediate (compound interest)
  {
    id: 'both-a1', type: 'choice', difficulty: 'advanced',
    question: 'Why diversify your investments?',
    options: [
      { id: 'a', label: 'To reduce risk', isCorrect: true },
      { id: 'b', label: 'To look smart', isCorrect: false },
      { id: 'c', label: "There's no reason", isCorrect: false },
    ],
    explanation: 'Diversification spreads risk — if one asset tanks, others might hold up.',
  },
  CRYPTO[2],          // intermediate (buy the dip)
  FINANCE[1],         // beginner (bull market)
];

export const demoQuestions: Record<Domain, DemoQuestion[]> = { CRYPTO, FINANCE, BOTH };
```

- [ ] **Step 4 : Lancer le test (doit passer)**

Run: `npx jest app/onboarding/data/demoQuestions.spec.ts`
Expected: PASS.

- [ ] **Step 5 : Commit**

```bash
git add app/onboarding/data/demoQuestions.ts app/onboarding/data/demoQuestions.spec.ts
git commit -m "feat(onboarding): banque de questions taguée par difficulté"
```

---

## Task 3 : Sélection des questions par domaine + niveau

**Files:**
- Create: `app/onboarding/data/selectDemoQuestions.ts`
- Test: `app/onboarding/data/selectDemoQuestions.spec.ts`

Règle : on retourne toujours **3** questions. On privilégie la difficulté correspondant au niveau de l'utilisateur, puis on complète avec les autres pour atteindre 3, dans un ordre stable.

- [ ] **Step 1 : Écrire le test qui échoue**

```ts
import { selectDemoQuestions, levelToDifficulty } from './selectDemoQuestions';

describe('selectDemoQuestions', () => {
  it('mappe le niveau vers une difficulté', () => {
    expect(levelToDifficulty('beginner')).toBe('beginner');
    expect(levelToDifficulty('intermediate')).toBe('intermediate');
    expect(levelToDifficulty('advanced')).toBe('advanced');
    expect(levelToDifficulty(null)).toBe('beginner'); // défaut
  });

  it('retourne toujours 3 questions', () => {
    expect(selectDemoQuestions('CRYPTO', 'beginner')).toHaveLength(3);
    expect(selectDemoQuestions('FINANCE', 'advanced')).toHaveLength(3);
    expect(selectDemoQuestions('BOTH', null)).toHaveLength(3);
  });

  it('priorise la difficulté du niveau en premier', () => {
    const qs = selectDemoQuestions('CRYPTO', 'advanced');
    expect(qs[0].difficulty).toBe('advanced');
  });

  it('ne renvoie pas de doublons d’id', () => {
    const qs = selectDemoQuestions('CRYPTO', 'beginner');
    expect(new Set(qs.map((q) => q.id)).size).toBe(3);
  });

  it('domaine inconnu/null retombe sur CRYPTO sans crasher', () => {
    expect(selectDemoQuestions(null, 'beginner')).toHaveLength(3);
  });
});
```

- [ ] **Step 2 : Lancer le test (doit échouer)**

Run: `npx jest app/onboarding/data/selectDemoQuestions.spec.ts`
Expected: FAIL (module introuvable).

- [ ] **Step 3 : Implémenter**

Créer `app/onboarding/data/selectDemoQuestions.ts` :

```ts
import { demoQuestions, DemoQuestion, Domain, Difficulty } from './demoQuestions';
import { Level } from '../hooks/useOnboardingStore';

const ORDER: Difficulty[] = ['beginner', 'intermediate', 'advanced'];

export function levelToDifficulty(level: Level | null): Difficulty {
  if (level === 'intermediate') return 'intermediate';
  if (level === 'advanced') return 'advanced';
  return 'beginner';
}

/**
 * Retourne 3 questions pour le domaine, en commençant par celles qui
 * correspondent au niveau, puis en complétant avec les autres difficultés.
 */
export function selectDemoQuestions(domain: Domain | null, level: Level | null): DemoQuestion[] {
  const pool = demoQuestions[domain ?? 'CRYPTO'] ?? demoQuestions.CRYPTO;
  const target = levelToDifficulty(level);

  // Ordre de préférence : niveau cible, puis les autres difficultés.
  const prefOrder: Difficulty[] = [target, ...ORDER.filter((d) => d !== target)];

  const ranked = [...pool].sort(
    (a, b) => prefOrder.indexOf(a.difficulty) - prefOrder.indexOf(b.difficulty),
  );

  return ranked.slice(0, 3);
}
```

- [ ] **Step 4 : Lancer le test (doit passer)**

Run: `npx jest app/onboarding/data/selectDemoQuestions.spec.ts`
Expected: PASS.

- [ ] **Step 5 : Commit**

```bash
git add app/onboarding/data/selectDemoQuestions.ts app/onboarding/data/selectDemoQuestions.spec.ts
git commit -m "feat(onboarding): sélection des questions par domaine + niveau"
```

---

## Task 4 : Helper de pseudo suggéré

**Files:**
- Create: `app/onboarding/lib/usernameSuggest.ts`
- Test: `app/onboarding/lib/usernameSuggest.spec.ts`

- [ ] **Step 1 : Écrire le test qui échoue**

```ts
import { suggestUsername, isValidUsername } from './usernameSuggest';

describe('usernameSuggest', () => {
  it('génère un pseudo valide (3-20 chars, alphanum + _)', () => {
    const u = suggestUsername(1234);
    expect(isValidUsername(u)).toBe(true);
  });

  it('intègre la base fournie quand elle est propre', () => {
    expect(suggestUsername(42, 'satoshi')).toMatch(/^satoshi_/);
  });

  it('nettoie une base avec caractères interdits', () => {
    expect(isValidUsername(suggestUsername(7, 'João Doe!'))).toBe(true);
  });

  it('isValidUsername rejette trop court / trop long / caractères interdits', () => {
    expect(isValidUsername('ab')).toBe(false);
    expect(isValidUsername('a'.repeat(21))).toBe(false);
    expect(isValidUsername('bad name')).toBe(false);
    expect(isValidUsername('good_name1')).toBe(true);
  });
});
```

- [ ] **Step 2 : Lancer le test (doit échouer)**

Run: `npx jest app/onboarding/lib/usernameSuggest.spec.ts`
Expected: FAIL (module introuvable).

- [ ] **Step 3 : Implémenter**

Créer `app/onboarding/lib/usernameSuggest.ts` :

```ts
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
```

- [ ] **Step 4 : Lancer le test (doit passer)**

Run: `npx jest app/onboarding/lib/usernameSuggest.spec.ts`
Expected: PASS.

- [ ] **Step 5 : Commit**

```bash
git add app/onboarding/lib/usernameSuggest.ts app/onboarding/lib/usernameSuggest.spec.ts
git commit -m "feat(onboarding): helper de pseudo suggéré"
```

---

## Task 5 : `finalizeOnboarding` idempotent (corrige les bugs)

**Files:**
- Create: `app/onboarding/hooks/finalizeOnboarding.ts`
- Test: `app/onboarding/hooks/finalizeOnboarding.spec.ts`

Corrige : (1) endpoint push `register-token` + `platform`, (2) permission/projectId, (3) création unique, (4) idempotence. On rend la fonction testable via **injection de dépendances** (un objet `deps` avec des valeurs par défaut câblant les vraies implémentations).

- [ ] **Step 1 : Écrire le test qui échoue**

```ts
import { runFinalize, toPlatformEnum, FinalizeDeps } from './finalizeOnboarding';

const baseState = {
  username: 'satoshi', email: null as string | null,
  domain: 'CRYPTO' as const, goal: 'invest', dailyMinutes: 5 as const,
  reminderHour: 9, notificationsEnabled: false,
};

function makeDeps(over: Partial<FinalizeDeps> = {}): FinalizeDeps {
  return {
    apiUrl: 'http://api.test/api',
    getExistingUserId: async () => null,
    persistUser: async () => {},
    clearOnboarding: async () => {},
    navigateToApp: () => {},
    requestPushPermission: async () => true,
    getPushToken: async () => 'ExponentPushToken[xxx]',
    platformOS: 'ios',
    fetchImpl: jest.fn(async (url: string) => {
      if (url.endsWith('/users')) {
        return { ok: true, status: 201, json: async () => ({ data: { id: 'u1', username: 'satoshi' } }) } as any;
      }
      return { ok: true, status: 200, json: async () => ({ success: true }) } as any;
    }),
    ...over,
  };
}

describe('toPlatformEnum', () => {
  it('mappe ios/android vers IOS/ANDROID', () => {
    expect(toPlatformEnum('ios')).toBe('IOS');
    expect(toPlatformEnum('android')).toBe('ANDROID');
    expect(toPlatformEnum('web')).toBe('ANDROID'); // défaut sûr
  });
});

describe('runFinalize', () => {
  it('crée le user puis persiste l’id et navigue', async () => {
    const deps = makeDeps();
    await runFinalize(baseState, deps);
    const urls = (deps.fetchImpl as jest.Mock).mock.calls.map((c) => c[0]);
    expect(urls).toContain('http://api.test/api/users');
    expect(urls).toContain('http://api.test/api/users/u1'); // PATCH prefs
  });

  it('est idempotent : ne recrée pas si un user existe déjà', async () => {
    const deps = makeDeps({ getExistingUserId: async () => 'existing' });
    await runFinalize(baseState, deps);
    const postUsers = (deps.fetchImpl as jest.Mock).mock.calls
      .filter((c) => c[0] === 'http://api.test/api/users' && c[1]?.method === 'POST');
    expect(postUsers).toHaveLength(0);
  });

  it('enregistre le push token sur le BON endpoint avec platform', async () => {
    const deps = makeDeps();
    await runFinalize({ ...baseState, notificationsEnabled: true }, deps);
    const call = (deps.fetchImpl as jest.Mock).mock.calls
      .find((c) => c[0] === 'http://api.test/api/notifications/register-token');
    expect(call).toBeTruthy();
    const body = JSON.parse(call[1].body);
    expect(body).toMatchObject({ userId: 'u1', token: 'ExponentPushToken[xxx]', platform: 'IOS' });
  });

  it('ne plante pas si la permission push est refusée', async () => {
    const deps = makeDeps({ notificationsEnabled: true as any, requestPushPermission: async () => false });
    await expect(runFinalize({ ...baseState, notificationsEnabled: true }, deps)).resolves.toBeUndefined();
    const call = (deps.fetchImpl as jest.Mock).mock.calls
      .find((c) => c[0] === 'http://api.test/api/notifications/register-token');
    expect(call).toBeFalsy(); // pas d'enregistrement sans permission
  });

  it('propage une erreur claire si la création échoue (409)', async () => {
    const deps = makeDeps({
      fetchImpl: jest.fn(async () => ({ ok: false, status: 409, json: async () => ({ message: 'taken' }) } as any)),
    });
    await expect(runFinalize(baseState, deps)).rejects.toThrow(/taken|déjà pris/i);
  });
});
```

- [ ] **Step 2 : Lancer le test (doit échouer)**

Run: `npx jest app/onboarding/hooks/finalizeOnboarding.spec.ts`
Expected: FAIL (module introuvable).

- [ ] **Step 3 : Implémenter**

Créer `app/onboarding/hooks/finalizeOnboarding.ts` :

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { useOnboardingStore } from './useOnboardingStore';

const REQUEST_TIMEOUT_MS = 60000; // large : couvre le cold-start Render (~42s)

export type FinalizeState = {
  username: string;
  email: string | null;
  domain: string | null;
  goal: string | null;
  dailyMinutes: 5 | 10 | 15 | null;
  reminderHour: number | null;
  notificationsEnabled: boolean;
};

export interface FinalizeDeps {
  apiUrl: string;
  getExistingUserId: () => Promise<string | null>;
  persistUser: (id: string, username: string) => Promise<void>;
  clearOnboarding: () => Promise<void>;
  navigateToApp: () => void;
  requestPushPermission: () => Promise<boolean>;
  getPushToken: () => Promise<string>;
  platformOS: string;
  fetchImpl: typeof fetch;
}

export function toPlatformEnum(os: string): 'IOS' | 'ANDROID' {
  return os === 'ios' ? 'IOS' : 'ANDROID';
}

async function fetchWithTimeout(
  fetchImpl: typeof fetch, input: string, init: RequestInit = {},
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetchImpl(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** Orchestration testable (sans dépendances natives). */
export async function runFinalize(state: FinalizeState, deps: FinalizeDeps): Promise<void> {
  const { apiUrl, fetchImpl } = deps;

  // 1) Création idempotente du user.
  let userId = await deps.getExistingUserId();
  let username = state.username;

  if (!userId) {
    const createBody: Record<string, unknown> = { username: state.username };
    if (state.email) createBody.email = state.email;

    let resp: Response;
    try {
      resp = await fetchWithTimeout(fetchImpl, `${apiUrl}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createBody),
      });
    } catch (err) {
      throw new Error(`Cannot reach the server (${(err as Error).message}). API: ${apiUrl}`);
    }
    if (!resp.ok) {
      let serverMsg = '';
      try {
        const body = await resp.json();
        serverMsg = typeof body?.message === 'string' ? body.message : (body?.message?.message ?? '');
      } catch { /* ignore */ }
      if (resp.status === 409) throw new Error(serverMsg || 'Ce nom est déjà pris, choisis-en un autre.');
      throw new Error(`Failed to create user (HTTP ${resp.status}${serverMsg ? ` — ${serverMsg}` : ''})`);
    }
    const { data: user } = await resp.json();
    userId = user.id;
    username = user.username;
    await deps.persistUser(userId, username);
  }

  // 2) Préférences (non bloquant).
  try {
    await fetchWithTimeout(fetchImpl, `${apiUrl}/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        preferredDomain: state.domain,
        userGoal: state.goal,
        dailyMinutes: state.dailyMinutes,
        reminderHour: state.reminderHour,
      }),
    });
  } catch (err) {
    console.warn('[finalize] prefs failed (non-blocking):', err);
  }

  // 3) Push token — endpoint correct + platform + permission (non bloquant).
  if (state.notificationsEnabled) {
    try {
      const granted = await deps.requestPushPermission();
      if (granted) {
        const token = await deps.getPushToken();
        await fetchWithTimeout(fetchImpl, `${apiUrl}/notifications/register-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId, token, platform: toPlatformEnum(deps.platformOS),
          }),
        });
      }
    } catch (err) {
      console.warn('[finalize] push token failed (non-blocking):', err);
    }
  }

  // 4) Magic link si email (non bloquant, fire-and-forget).
  if (state.email) {
    fetchWithTimeout(fetchImpl, `${apiUrl}/auth/magic-link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, email: state.email }),
    }).catch((err) => console.warn('[finalize] magic link failed:', err));
  }

  await deps.clearOnboarding();
  deps.navigateToApp();
}

/** Point d'entrée réel utilisé par l'UI : câble les vraies dépendances. */
export async function finalizeOnboarding(): Promise<void> {
  const s = useOnboardingStore.getState();
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';
  const projectId =
    (Constants.expoConfig?.extra as any)?.eas?.projectId ??
    (Constants as any)?.easConfig?.projectId;

  await runFinalize(
    {
      username: s.username, email: s.email,
      domain: s.domain, goal: s.goal,
      dailyMinutes: s.dailyMinutes, reminderHour: s.reminderHour,
      notificationsEnabled: s.notificationsEnabled,
    },
    {
      apiUrl,
      getExistingUserId: () => AsyncStorage.getItem('@mindy/user_id'),
      persistUser: async (id, username) => {
        await AsyncStorage.multiSet([['@mindy/user_id', id], ['@mindy/username', username]]);
      },
      clearOnboarding: async () => {
        s.reset();
        await AsyncStorage.removeItem('@mindy/onboarding_state');
      },
      navigateToApp: () => router.replace('/(tabs)'),
      requestPushPermission: async () => {
        const { status } = await Notifications.requestPermissionsAsync();
        return status === 'granted';
      },
      getPushToken: async () => {
        const t = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
        return t.data;
      },
      platformOS: Platform.OS,
      fetchImpl: fetch,
    },
  );
}
```

- [ ] **Step 4 : Lancer le test (doit passer)**

Run: `npx jest app/onboarding/hooks/finalizeOnboarding.spec.ts`
Expected: PASS.

> Note : si `expo-constants` n'est pas déjà importable en test, ce n'est pas un souci — le `.spec` teste uniquement `runFinalize`/`toPlatformEnum`, qui n'importent rien de natif au moment de l'appel (les imports natifs ne sont touchés que par `finalizeOnboarding()`, non couvert). Si l'import top-level d'`expo-constants` casse Jest, déplacer cet import en `require()` paresseux dans `finalizeOnboarding()`.

- [ ] **Step 5 : Commit**

```bash
git add app/onboarding/hooks/finalizeOnboarding.ts app/onboarding/hooks/finalizeOnboarding.spec.ts
git commit -m "feat(onboarding): finalize idempotent + fix push token endpoint/permission"
```

---

## Task 6 : `useUser.initUser` ne crée plus de user en onboarding

**Files:**
- Modify: `src/hooks/useUser.ts`

But : supprimer le second chemin de création (divergent). `initUser` ne sert plus qu'à **réutiliser** un user existant (vérification), la création passe exclusivement par `finalizeOnboarding`. Aucun test (logique enchevêtrée avec hooks React ; couverte manuellement).

- [ ] **Step 1 : Vérifier les usages d'`initUser`**

Run: `grep -rn "initUser" app src --include=*.tsx --include=*.ts | grep -v useUser.ts`
Expected: lister les appelants. (Si seul l'ancien `SignupStep`/onboarding l'utilisait, ils seront remplacés ; sinon adapter chaque appelant à `refreshUser`.)

- [ ] **Step 2 : Simplifier `initUser`**

Dans `src/hooks/useUser.ts`, remplacer tout le corps de `const initUser = useCallback(...)` (lignes 100-201) par une version qui ne crée plus :

```ts
  // Ré-utilise un user déjà créé (la CRÉATION se fait dans finalizeOnboarding).
  const initUser = useCallback(async () => {
    await checkExistingUser();
  }, [checkExistingUser]);
```

- [ ] **Step 3 : Type-check**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: aucune erreur liée à `useUser`. (Si un appelant passait des arguments à `initUser`, les retirer.)

- [ ] **Step 4 : Commit**

```bash
git add src/hooks/useUser.ts
git commit -m "refactor(user): création unique via finalizeOnboarding (initUser ne crée plus)"
```

---

# PHASE 1 — Coquille visuelle persistante

## Task 7 : Composant `MindyTurn`

**Files:**
- Create: `app/onboarding/components/MindyTurn.tsx`

Structure commune d'un écran : message terminal de Mindy (typing) + slot de réponses + bouton. La mascotte et la progress bar NE sont PAS ici (elles vivent dans le layout — Task 8). Pas de test (composant UI ; vérif manuelle).

- [ ] **Step 1 : Créer le composant**

```tsx
import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { MindyMessage } from '@/components/MindyMessage';
import { MindyMood } from '@/components/mindy/MindyMascot';
import { PrimaryButton } from './PrimaryButton';

interface Props {
  /** Mood courant — pilote aussi la mascotte du layout via le store si besoin. */
  mood?: MindyMood;
  /** Message tapé par Mindy. */
  message: string;
  /** Contenu de réponse (cartes, input, quiz...). */
  children: React.ReactNode;
  /** Libellé du bouton principal. */
  ctaLabel?: string;
  onCta?: () => void;
  /** Désactive le CTA tant que pas prêt (ex. pas de sélection). */
  ctaDisabled?: boolean;
  ctaLoading?: boolean;
  /** Bouton secondaire optionnel (ghost). */
  secondary?: React.ReactNode;
  keyboardAware?: boolean;
  /** clé unique de l'écran pour rejouer l'animation d'entrée. */
  turnKey: string;
}

export function MindyTurn({
  mood = 'neutral', message, children,
  ctaLabel, onCta, ctaDisabled, ctaLoading, secondary,
  keyboardAware, turnKey,
}: Props) {
  // Le CTA reste verrouillé tant que Mindy n'a pas fini de "parler".
  const [typingDone, setTypingDone] = useState(false);

  const body = (
    <Animated.View
      key={turnKey}
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(150)}
      style={styles.flex1}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <MindyMessage
          message={message}
          mood={mood}
          onComplete={() => setTypingDone(true)}
        />
        <View style={styles.answers}>{children}</View>
      </ScrollView>

      {(ctaLabel || secondary) && (
        <View style={styles.footer}>
          {ctaLabel && (
            <PrimaryButton
              onPress={onCta ?? (() => {})}
              disabled={ctaDisabled || !typingDone}
              loading={ctaLoading}
            >
              {ctaLabel}
            </PrimaryButton>
          )}
          {secondary}
        </View>
      )}
    </Animated.View>
  );

  if (!keyboardAware) return body;
  return (
    <KeyboardAvoidingView style={styles.flex1} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {body}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  scroll: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16, flexGrow: 1 },
  answers: { marginTop: 24, gap: 12 },
  footer: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 40, gap: 12 },
});
```

- [ ] **Step 2 : Type-check**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: aucune erreur dans `MindyTurn.tsx`.

- [ ] **Step 3 : Commit**

```bash
git add app/onboarding/components/MindyTurn.tsx
git commit -m "feat(onboarding): composant MindyTurn (coquille d'un écran)"
```

---

## Task 8 : Layout persistant (mascotte + progress)

**Files:**
- Modify: `app/onboarding/_layout.tsx`
- Modify: `app/onboarding/hooks/useOnboardingStore.ts` (ajouter `mood` courant)
- Modify: `app/onboarding/components/ProgressBar.tsx` (masquer sur `hello`)

La mascotte vit dans le layout et lit le `mood` courant depuis le store → elle persiste entre écrans. Chaque step pose le mood via `setMood`.

- [ ] **Step 1 : Ajouter `mood` au store**

Dans `useOnboardingStore.ts` : importer le type mood en tête —
```ts
import type { MindyMood } from '@/components/mindy/MindyMascot';
```
Dans `interface OnboardingState`, ajouter `mood: MindyMood;` et `setMood: (m: MindyMood) => void;`.
Dans `initialState`, ajouter `mood: 'neutral' as MindyMood,`.
Dans le store, ajouter `setMood: (mood) => set({ mood }),`.

- [ ] **Step 2 : Mettre à jour le test du store**

Dans `useOnboardingStore.spec.ts`, ajouter :
```ts
  it('setMood change le mood courant', () => {
    useOnboardingStore.getState().setMood('hype');
    expect(useOnboardingStore.getState().mood).toBe('hype');
  });
```
Run: `npx jest app/onboarding/hooks/useOnboardingStore.spec.ts` → PASS.

- [ ] **Step 3 : Masquer la progress bar sur `hello`**

Dans `ProgressBar.tsx`, remplacer `if (currentStep === 'welcome') return null;` par `if (currentStep === 'hello') return null;`.

- [ ] **Step 4 : Réécrire le layout**

Remplacer `app/onboarding/_layout.tsx` par :

```tsx
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Slot } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { ProgressBar } from './components/ProgressBar';
import { MindyMascot } from '@/components/mindy';
import { useOnboardingStore } from './hooks/useOnboardingStore';

export default function OnboardingLayout() {
  const mood = useOnboardingStore((s) => s.mood);
  const currentStep = useOnboardingStore((s) => s.currentStep);
  // Mascotte plus grande sur l'accroche.
  const size = currentStep === 'hello' ? 150 : 96;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ProgressBar />
      <View style={styles.mascotWrap}>
        <MindyMascot mood={mood} size={size} />
      </View>
      <View style={styles.flex1}>
        <Slot />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0D1117', paddingTop: 60 },
  flex1: { flex: 1 },
  mascotWrap: { alignItems: 'center', paddingTop: 12, paddingBottom: 4 },
});
```

- [ ] **Step 5 : Type-check + commit**

Run: `npx tsc --noEmit -p tsconfig.json` → OK.
```bash
git add app/onboarding/_layout.tsx app/onboarding/components/ProgressBar.tsx app/onboarding/hooks/useOnboardingStore.ts app/onboarding/hooks/useOnboardingStore.spec.ts
git commit -m "feat(onboarding): coquille persistante (mascotte + progress dans le layout)"
```

---

## Task 9 : `AnswerCards` réutilisable

**Files:**
- Create: `app/onboarding/components/AnswerCards.tsx`

Cartes de choix génériques (utilisées par niveau/domaine/objectif/temps). `TouchableOpacity` + styles statiques (gotcha respecté).

- [ ] **Step 1 : Créer le composant**

```tsx
import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';

export interface AnswerOption {
  id: string;
  label: string;
  sublabel?: string;
  icon?: string; // emoji
}

interface Props {
  options: AnswerOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function AnswerCards({ options, selectedId, onSelect }: Props) {
  return (
    <View style={styles.list}>
      {options.map((opt) => {
        const selected = opt.id === selectedId;
        return (
          <TouchableOpacity
            key={opt.id}
            activeOpacity={0.8}
            onPress={() => onSelect(opt.id)}
            style={selected ? styles.cardSelected : styles.card}
          >
            {opt.icon ? <Text style={styles.icon}>{opt.icon}</Text> : null}
            <View style={styles.flex1}>
              <Text style={selected ? styles.labelSelected : styles.label}>{opt.label}</Text>
              {opt.sublabel ? <Text style={styles.sublabel}>{opt.sublabel}</Text> : null}
            </View>
            {selected ? <Text style={styles.check}>✓</Text> : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const baseCard = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 12,
  padding: 16,
  borderRadius: 12,
  borderWidth: 2,
  backgroundColor: '#161B22',
};

const styles = StyleSheet.create({
  list: { gap: 12 },
  card: { ...baseCard, borderColor: '#30363D' },
  cardSelected: { ...baseCard, borderColor: '#39FF14', backgroundColor: 'rgba(57,255,20,0.08)' },
  icon: { fontSize: 24 },
  flex1: { flex: 1 },
  label: { fontFamily: 'Inter', fontSize: 16, color: '#E6EDF3', fontWeight: '600' },
  labelSelected: { fontFamily: 'Inter', fontSize: 16, color: '#39FF14', fontWeight: '700' },
  sublabel: { fontFamily: 'Inter', fontSize: 13, color: '#8B949E', marginTop: 2 },
  check: { fontFamily: 'Inter', fontSize: 18, color: '#39FF14', fontWeight: '700' },
});
```

- [ ] **Step 2 : Type-check + commit**

Run: `npx tsc --noEmit -p tsconfig.json` → OK.
```bash
git add app/onboarding/components/AnswerCards.tsx
git commit -m "feat(onboarding): composant AnswerCards réutilisable"
```

---

# PHASE 2 — Les 9 écrans

> Pour chaque step : poser le mood via `setMood` au montage (`useEffect`), rendre via `MindyTurn`, avancer via `next()`. Tous les steps sont des composants nommés exportés.

## Task 10 : HelloStep (écran 1)

**Files:**
- Create: `app/onboarding/steps/HelloStep.tsx`

- [ ] **Step 1 : Créer**

```tsx
import React, { useEffect } from 'react';
import { router } from 'expo-router';
import { MindyTurn } from '../components/MindyTurn';
import { PrimaryButton } from '../components/PrimaryButton';
import { useOnboardingStore } from '../hooks/useOnboardingStore';

export function HelloStep() {
  const next = useOnboardingStore((s) => s.next);
  const setMood = useOnboardingStore((s) => s.setMood);
  useEffect(() => { setMood('hype'); }, [setMood]);

  return (
    <MindyTurn
      turnKey="hello"
      mood="hype"
      message="Salut 👋 Moi c'est Mindy, ton coach. En 2 min, je te montre comment devenir bon en argent."
      ctaLabel="C'est parti"
      onCta={next}
      secondary={
        <PrimaryButton variant="ghost" onPress={() => router.replace('/login')}>
          J'ai déjà un compte
        </PrimaryButton>
      }
    >
      {null}
    </MindyTurn>
  );
}
```

- [ ] **Step 2 : Type-check + commit**

Run: `npx tsc --noEmit -p tsconfig.json` → OK.
```bash
git add app/onboarding/steps/HelloStep.tsx
git commit -m "feat(onboarding): écran Hello"
```

---

## Task 11 : LevelStep (écran 2 — nouveau)

**Files:**
- Create: `app/onboarding/steps/LevelStep.tsx`

- [ ] **Step 1 : Créer**

```tsx
import React, { useEffect } from 'react';
import { MindyTurn } from '../components/MindyTurn';
import { AnswerCards } from '../components/AnswerCards';
import { useOnboardingStore, Level } from '../hooks/useOnboardingStore';

const OPTIONS = [
  { id: 'beginner', label: 'Débutant total', sublabel: 'Je pars de zéro', icon: '🌱' },
  { id: 'intermediate', label: 'Je connais 2-3 trucs', sublabel: 'Les bases, sans plus', icon: '📈' },
  { id: 'advanced', label: 'Je gère déjà', sublabel: 'Montre-moi du lourd', icon: '🚀' },
];

export function LevelStep() {
  const next = useOnboardingStore((s) => s.next);
  const level = useOnboardingStore((s) => s.level);
  const setLevel = useOnboardingStore((s) => s.setLevel);
  const setMood = useOnboardingStore((s) => s.setMood);
  useEffect(() => { setMood('neutral'); }, [setMood]);

  return (
    <MindyTurn
      turnKey="level"
      mood="neutral"
      message="D'abord, t'es plutôt… ?"
      ctaLabel="Continuer"
      ctaDisabled={!level}
      onCta={next}
    >
      <AnswerCards options={OPTIONS} selectedId={level} onSelect={(id) => setLevel(id as Level)} />
    </MindyTurn>
  );
}
```

- [ ] **Step 2 : Type-check + commit**

Run: `npx tsc --noEmit -p tsconfig.json` → OK.
```bash
git add app/onboarding/steps/LevelStep.tsx
git commit -m "feat(onboarding): écran Niveau"
```

---

## Task 12 : DomainStep (écran 3 — réécrit, icône blockchain)

**Files:**
- Modify: `app/onboarding/steps/DomainStep.tsx` (réécriture complète)

- [ ] **Step 1 : Réécrire**

```tsx
import React, { useEffect } from 'react';
import { MindyTurn } from '../components/MindyTurn';
import { AnswerCards } from '../components/AnswerCards';
import { useOnboardingStore, Domain } from '../hooks/useOnboardingStore';

const OPTIONS = [
  { id: 'CRYPTO', label: 'Crypto', sublabel: 'Bitcoin, blockchain, DeFi', icon: '⛓️' },
  { id: 'FINANCE', label: 'Finance', sublabel: 'Investir, budget, bourse', icon: '💰' },
  { id: 'BOTH', label: 'Les deux', sublabel: 'Pourquoi choisir ?', icon: '✨' },
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

- [ ] **Step 2 : Type-check + commit**

Run: `npx tsc --noEmit -p tsconfig.json` → OK.
```bash
git add app/onboarding/steps/DomainStep.tsx
git commit -m "feat(onboarding): écran Domaine (icône blockchain)"
```

---

## Task 13 : GoalStep (écran 4 — réécrit)

**Files:**
- Modify: `app/onboarding/steps/GoalStep.tsx`

- [ ] **Step 1 : Réécrire**

```tsx
import React, { useEffect } from 'react';
import { MindyTurn } from '../components/MindyTurn';
import { AnswerCards } from '../components/AnswerCards';
import { useOnboardingStore } from '../hooks/useOnboardingStore';

const OPTIONS = [
  { id: 'invest', label: 'Commencer à investir', icon: '📈' },
  { id: 'understand', label: 'Comprendre les bases', icon: '🧠' },
  { id: 'career', label: 'Booster ma carrière', icon: '🚀' },
  { id: 'curiosity', label: 'Juste curieux', icon: '🔍' },
];

export function GoalStep() {
  const next = useOnboardingStore((s) => s.next);
  const goal = useOnboardingStore((s) => s.goal);
  const setGoal = useOnboardingStore((s) => s.setGoal);
  const setMood = useOnboardingStore((s) => s.setMood);
  useEffect(() => { setMood('neutral'); }, [setMood]);

  return (
    <MindyTurn
      turnKey="goal"
      mood="neutral"
      message="Et pourquoi ? Ça m'aide à personnaliser tout ça."
      ctaLabel="Continuer"
      ctaDisabled={!goal}
      onCta={next}
    >
      <AnswerCards options={OPTIONS} selectedId={goal} onSelect={setGoal} />
    </MindyTurn>
  );
}
```

- [ ] **Step 2 : Type-check + commit**

Run: `npx tsc --noEmit -p tsconfig.json` → OK.
```bash
git add app/onboarding/steps/GoalStep.tsx
git commit -m "feat(onboarding): écran Objectif"
```

---

## Task 14 : TimeStep (écran 5 — réécrit)

**Files:**
- Modify: `app/onboarding/steps/TimeStep.tsx`

- [ ] **Step 1 : Réécrire**

```tsx
import React, { useEffect } from 'react';
import { MindyTurn } from '../components/MindyTurn';
import { AnswerCards } from '../components/AnswerCards';
import { useOnboardingStore } from '../hooks/useOnboardingStore';

const OPTIONS = [
  { id: '5', label: '5 min / jour', sublabel: 'Tranquille', icon: '☕' },
  { id: '10', label: '10 min / jour', sublabel: 'Régulier', icon: '🔥' },
  { id: '15', label: '15 min / jour', sublabel: 'Sérieux', icon: '⚡' },
];

export function TimeStep() {
  const next = useOnboardingStore((s) => s.next);
  const dailyMinutes = useOnboardingStore((s) => s.dailyMinutes);
  const setDailyMinutes = useOnboardingStore((s) => s.setDailyMinutes);
  const setMood = useOnboardingStore((s) => s.setMood);
  useEffect(() => { setMood('neutral'); }, [setMood]);

  return (
    <MindyTurn
      turnKey="time"
      mood="neutral"
      message="Combien de temps par jour ? 5 min suffisent si tu reviens tous les jours 🔥"
      ctaLabel="Continuer"
      ctaDisabled={!dailyMinutes}
      onCta={next}
    >
      <AnswerCards
        options={OPTIONS}
        selectedId={dailyMinutes ? String(dailyMinutes) : null}
        onSelect={(id) => setDailyMinutes(Number(id) as 5 | 10 | 15)}
      />
    </MindyTurn>
  );
}
```

- [ ] **Step 2 : Type-check + commit**

Run: `npx tsc --noEmit -p tsconfig.json` → OK.
```bash
git add app/onboarding/steps/TimeStep.tsx
git commit -m "feat(onboarding): écran Temps quotidien"
```

---

## Task 15 : DemoQuestionStep (écran 6 — gère les 3 questions)

**Files:**
- Modify: `app/onboarding/steps/DemoQuestionStep.tsx` (réécriture : un seul composant gère la séquence de 3)

Le composant gère un index interne 0→2, lit les questions via `selectDemoQuestions(domain, level)`, donne un feedback par réponse (mood hype/roast + haptic), puis passe à `next()` (→ result) après la 3e.

- [ ] **Step 1 : Réécrire**

```tsx
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { MindyTurn } from '../components/MindyTurn';
import { useOnboardingStore } from '../hooks/useOnboardingStore';
import { selectDemoQuestions } from '../data/selectDemoQuestions';

export function DemoQuestionStep() {
  const domain = useOnboardingStore((s) => s.domain);
  const level = useOnboardingStore((s) => s.level);
  const next = useOnboardingStore((s) => s.next);
  const recordDemoAnswer = useOnboardingStore((s) => s.recordDemoAnswer);
  const setMood = useOnboardingStore((s) => s.setMood);

  const [questions] = useState(() => selectDemoQuestions(domain, level));
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [correct, setCorrect] = useState<boolean | null>(null);

  const q = questions[index];

  useEffect(() => { setMood('neutral'); }, [setMood, index]);

  const answer = async (optionId: string, isCorrect: boolean) => {
    if (picked) return; // déjà répondu
    setPicked(optionId);
    setCorrect(isCorrect);
    recordDemoAnswer(q.id, isCorrect);
    setMood(isCorrect ? 'hype' : 'roast');
    await Haptics.notificationAsync(
      isCorrect ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning,
    );
  };

  const proceed = () => {
    if (index < questions.length - 1) {
      setIndex(index + 1);
      setPicked(null);
      setCorrect(null);
    } else {
      next(); // → result
    }
  };

  const message = picked
    ? (correct ? `Exact ! ${q.explanation}` : `Pas tout à fait. ${q.explanation}`)
    : `Question ${index + 1}/3 — ${q.question}`;

  return (
    <MindyTurn
      turnKey={`demo-${index}`}
      mood={picked ? (correct ? 'hype' : 'roast') : 'neutral'}
      message={message}
      ctaLabel={picked ? (index < questions.length - 1 ? 'Suivant' : 'Voir mon score') : undefined}
      onCta={proceed}
    >
      <View style={styles.options}>
        {q.type === 'true_false' ? (
          <>
            <Choice label="VRAI" active={picked === 'true'} good={picked != null && q.correctAnswer === true}
              bad={picked === 'true' && q.correctAnswer !== true}
              onPress={() => answer('true', q.correctAnswer === true)} />
            <Choice label="FAUX" active={picked === 'false'} good={picked != null && q.correctAnswer === false}
              bad={picked === 'false' && q.correctAnswer !== false}
              onPress={() => answer('false', q.correctAnswer === false)} />
          </>
        ) : (
          q.options.map((o) => (
            <Choice
              key={o.id}
              label={o.label}
              big={q.type === 'image_choice'}
              active={picked === o.id}
              good={picked != null && o.isCorrect}
              bad={picked === o.id && !o.isCorrect}
              onPress={() => answer(o.id, o.isCorrect)}
            />
          ))
        )}
      </View>
    </MindyTurn>
  );
}

function Choice({ label, onPress, active, good, bad, big }: {
  label: string; onPress: () => void; active?: boolean; good?: boolean; bad?: boolean; big?: boolean;
}) {
  let style = styles.choice;
  if (good) style = styles.choiceGood;
  else if (bad) style = styles.choiceBad;
  else if (active) style = styles.choiceActive;
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={style}>
      <Text style={big ? styles.choiceTextBig : styles.choiceText}>{label}</Text>
    </TouchableOpacity>
  );
}

const base = {
  padding: 16, borderRadius: 12, borderWidth: 2, borderColor: '#30363D',
  backgroundColor: '#161B22', alignItems: 'center' as const,
};
const styles = StyleSheet.create({
  options: { gap: 12 },
  choice: base,
  choiceActive: { ...base, borderColor: '#58A6FF' },
  choiceGood: { ...base, borderColor: '#39FF14', backgroundColor: 'rgba(57,255,20,0.12)' },
  choiceBad: { ...base, borderColor: '#F85149', backgroundColor: 'rgba(248,81,73,0.12)' },
  choiceText: { fontFamily: 'Inter', fontSize: 16, color: '#E6EDF3', fontWeight: '600' },
  choiceTextBig: { fontFamily: 'Inter', fontSize: 32 },
});
```

- [ ] **Step 2 : Type-check + commit**

Run: `npx tsc --noEmit -p tsconfig.json` → OK.
```bash
git add app/onboarding/steps/DemoQuestionStep.tsx
git commit -m "feat(onboarding): mini-leçon démo (3 questions, feedback Mindy)"
```

---

## Task 16 : XpReveal + ResultStep (écran 7)

**Files:**
- Create: `app/onboarding/components/XpReveal.tsx`
- Create: `app/onboarding/steps/ResultStep.tsx`

- [ ] **Step 1 : Créer `XpReveal`**

```tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn, useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

interface Props { xp: number; }

/** Compteur XP qui monte + barre qui se remplit. */
export function XpReveal({ xp }: Props) {
  const [shown, setShown] = useState(0);
  const width = useSharedValue(0);

  useEffect(() => {
    // Animation simple du compteur (JS interval) — pas critique.
    let v = 0;
    const step = Math.max(1, Math.round(xp / 20));
    const id = setInterval(() => {
      v = Math.min(xp, v + step);
      setShown(v);
      if (v >= xp) clearInterval(id);
    }, 40);
    width.value = withTiming(100, { duration: 900 });
    return () => clearInterval(id);
  }, [xp]);

  const barStyle = useAnimatedStyle(() => ({ width: `${width.value}%` }));

  return (
    <Animated.View entering={FadeIn} style={styles.box}>
      <Text style={styles.xp}>+{shown} XP</Text>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, barStyle]} />
      </View>
      <Text style={styles.caption}>Niveau 1 — tu démarres fort 🔥</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', gap: 12, paddingVertical: 12 },
  xp: { fontFamily: 'JetBrainsMono', fontSize: 40, fontWeight: '700', color: '#FFD700' },
  track: { width: '100%', height: 10, backgroundColor: '#30363D', borderRadius: 5, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: '#39FF14', borderRadius: 5 },
  caption: { fontFamily: 'Inter', fontSize: 14, color: '#8B949E' },
});
```

- [ ] **Step 2 : Créer `ResultStep`**

```tsx
import React, { useEffect } from 'react';
import { MindyTurn } from '../components/MindyTurn';
import { XpReveal } from '../components/XpReveal';
import { Confetti } from '@/components/animations/Confetti';
import { useOnboardingStore } from '../hooks/useOnboardingStore';

export function ResultStep() {
  const next = useOnboardingStore((s) => s.next);
  const demoScore = useOnboardingStore((s) => s.demoScore);
  const setMood = useOnboardingStore((s) => s.setMood);
  useEffect(() => { setMood('hype'); }, [setMood]);

  const xp = demoScore * 10;
  const msg =
    demoScore >= 2 ? `Joli, ${demoScore}/3 ! Tu viens de gagner tes premiers XP 🎉`
    : demoScore === 1 ? `${demoScore}/3 — c'est un début, on va vite progresser 💪`
    : `0/3 cette fois… mais c'est exactement pour ça que t'es là 😉`;

  return (
    <MindyTurn turnKey="result" mood="hype" message={msg} ctaLabel="Sauver ma progression" onCta={next}>
      {/* Confetti uniquement si au moins une bonne réponse (sinon ça sonne faux). */}
      {demoScore > 0 ? <Confetti count={60} active /> : null}
      <XpReveal xp={xp} />
    </MindyTurn>
  );
}
```

> Note : le composant `Confetti` existant a la signature `{ count?: number; active?: boolean; onComplete?: () => void }`. Si son import (chemin/props) diffère à l'implémentation, l'adapter — c'est un overlay décoratif, non bloquant.

- [ ] **Step 3 : Type-check + commit**

Run: `npx tsc --noEmit -p tsconfig.json` → OK.
```bash
git add app/onboarding/components/XpReveal.tsx app/onboarding/steps/ResultStep.tsx
git commit -m "feat(onboarding): écran Résultat + révélation XP"
```

---

## Task 17 : SignupStep (écran 8 — réécrit, création de compte)

**Files:**
- Modify: `app/onboarding/steps/SignupStep.tsx`

Champ pseudo pré-rempli via `suggestUsername`, validation live, email optionnel. Ne finalise PAS encore (la finalisation se fait à l'écran Plan), mais valide le pseudo et avance.

- [ ] **Step 1 : Réécrire**

```tsx
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { MindyTurn } from '../components/MindyTurn';
import { useOnboardingStore } from '../hooks/useOnboardingStore';
import { suggestUsername, isValidUsername } from '../lib/usernameSuggest';

export function SignupStep() {
  const next = useOnboardingStore((s) => s.next);
  const username = useOnboardingStore((s) => s.username);
  const setUsername = useOnboardingStore((s) => s.setUsername);
  const email = useOnboardingStore((s) => s.email);
  const setEmail = useOnboardingStore((s) => s.setEmail);
  const setMood = useOnboardingStore((s) => s.setMood);
  useEffect(() => { setMood('neutral'); }, [setMood]);

  // Pré-remplit un pseudo suggéré une seule fois si vide.
  const suggested = useMemo(() => suggestUsername(Date.now()), []);
  useEffect(() => {
    if (!username) setUsername(suggested);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [emailText, setEmailText] = useState(email ?? '');
  const valid = isValidUsername(username);

  const handleNext = () => {
    setEmail(emailText.trim() ? emailText.trim() : null);
    next();
  };

  return (
    <MindyTurn
      turnKey="signup"
      mood="neutral"
      message="Choisis ton pseudo — c'est comme ça que tu apparaîtras dans le classement."
      ctaLabel="Continuer"
      ctaDisabled={!valid}
      onCta={handleNext}
      keyboardAware
    >
      <View style={styles.field}>
        <Text style={styles.at}>@</Text>
        <TextInput
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="satoshi"
          placeholderTextColor="#484F58"
          style={[styles.input, valid ? styles.inputOk : styles.inputBad]}
        />
      </View>
      <Text style={styles.hint}>Lettres, chiffres, underscore — 3 à 20 caractères.</Text>

      <Text style={styles.label}>Email (optionnel)</Text>
      <TextInput
        value={emailText}
        onChangeText={setEmailText}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        placeholder="ton@email.com"
        placeholderTextColor="#484F58"
        style={[styles.input, styles.inputOk]}
      />
      <Text style={styles.hint}>Pour récupérer ton compte sur un autre téléphone.</Text>
    </MindyTurn>
  );
}

const styles = StyleSheet.create({
  field: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  at: { fontFamily: 'JetBrainsMono', fontSize: 22, color: '#39FF14' },
  input: {
    flex: 1, fontFamily: 'Inter', fontSize: 16, color: '#E6EDF3',
    backgroundColor: '#161B22', borderRadius: 12, borderWidth: 2, padding: 14,
  },
  inputOk: { borderColor: '#30363D' },
  inputBad: { borderColor: '#F85149' },
  label: { fontFamily: 'Inter', fontSize: 14, color: '#8B949E', marginTop: 16, marginBottom: 6 },
  hint: { fontFamily: 'Inter', fontSize: 12, color: '#8B949E', marginTop: 6 },
});
```

- [ ] **Step 2 : Type-check + commit**

Run: `npx tsc --noEmit -p tsconfig.json` → OK.
```bash
git add app/onboarding/steps/SignupStep.tsx
git commit -m "feat(onboarding): écran Pseudo (suggestion + validation)"
```

---

## Task 18 : PlanBuilder + PlanStep (écran 9 — finalise)

**Files:**
- Create: `app/onboarding/components/PlanBuilder.tsx`
- Create: `app/onboarding/steps/PlanStep.tsx`

`PlanStep` est le dernier écran : Mindy « génère » le plan (lignes terminal), propose la notif quotidienne, puis appelle `finalizeOnboarding`. Gère l'échec réseau avec un bouton « Réessayer ».

- [ ] **Step 1 : Créer `PlanBuilder`**

```tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props { lines: string[]; }

/** Affiche des lignes "terminal" une par une, façon build. */
export function PlanBuilder({ lines }: Props) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (count >= lines.length) return;
    const id = setTimeout(() => setCount((c) => c + 1), 500);
    return () => clearTimeout(id);
  }, [count, lines.length]);

  return (
    <View style={styles.box}>
      {lines.slice(0, count).map((l, i) => (
        <Text key={i} style={styles.line}>
          <Text style={styles.prompt}>{'> '}</Text>{l}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: '#0D1117', borderRadius: 12, borderWidth: 1, borderColor: '#30363D',
    padding: 14, gap: 6,
  },
  line: { fontFamily: 'JetBrainsMono', fontSize: 13, color: '#E6EDF3', lineHeight: 20 },
  prompt: { color: '#39FF14' },
});
```

- [ ] **Step 2 : Créer `PlanStep`**

```tsx
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { MindyTurn } from '../components/MindyTurn';
import { PlanBuilder } from '../components/PlanBuilder';
import { useOnboardingStore } from '../hooks/useOnboardingStore';
import { finalizeOnboarding } from '../hooks/finalizeOnboarding';

const REMINDER_OPTS = [
  { hour: 9, label: 'Matin · 09:00' },
  { hour: 12, label: 'Midi · 12:00' },
  { hour: 20, label: 'Soir · 20:00' },
];

export function PlanStep() {
  const domain = useOnboardingStore((s) => s.domain);
  const goal = useOnboardingStore((s) => s.goal);
  const dailyMinutes = useOnboardingStore((s) => s.dailyMinutes);
  const setNotifications = useOnboardingStore((s) => s.setNotifications);
  const setMood = useOnboardingStore((s) => s.setMood);

  const [hour, setHour] = useState<number>(dailyMinutes === 5 ? 9 : dailyMinutes === 10 ? 12 : 20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { setMood('thinking'); }, [setMood]);

  const planLines = useMemo(() => [
    `domaine: ${domain ?? 'CRYPTO'}`,
    `objectif: ${goal ?? 'understand'}`,
    `rythme: ${dailyMinutes ?? 5} min/jour`,
    'parcours généré ✓',
  ], [domain, goal, dailyMinutes]);

  const finish = async (notif: boolean) => {
    setError(null);
    setLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setNotifications(notif, notif ? hour : null);
    try {
      await finalizeOnboarding();
    } catch (err) {
      setError((err as Error).message || String(err));
      setLoading(false);
    }
  };

  return (
    <MindyTurn
      turnKey="plan"
      mood="thinking"
      message="Je te construis un parcours sur-mesure…"
      ctaLabel="Activer le rappel quotidien"
      onCta={() => finish(true)}
      ctaLoading={loading}
      secondary={
        <TouchableOpacity onPress={() => finish(false)} disabled={loading} style={styles.ghost}>
          <Text style={styles.ghostText}>Plus tard</Text>
        </TouchableOpacity>
      }
    >
      <PlanBuilder lines={planLines} />

      <Text style={styles.label}>Je te rappelle quand ?</Text>
      <View style={styles.chips}>
        {REMINDER_OPTS.map((o) => (
          <TouchableOpacity
            key={o.hour}
            activeOpacity={0.8}
            onPress={() => setHour(o.hour)}
            style={hour === o.hour ? styles.chipOn : styles.chip}
          >
            <Text style={hour === o.hour ? styles.chipTextOn : styles.chipText}>{o.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.errorHint}>Vérifie ta connexion. Le serveur peut mettre ~40s à se réveiller.</Text>
          <TouchableOpacity onPress={() => finish(false)} style={styles.retry}>
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </MindyTurn>
  );
}

const chipBase = {
  paddingVertical: 10, paddingHorizontal: 14, borderRadius: 999,
  borderWidth: 2, borderColor: '#30363D', backgroundColor: '#161B22',
};
const styles = StyleSheet.create({
  label: { fontFamily: 'Inter', fontSize: 14, color: '#8B949E', marginTop: 20, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: chipBase,
  chipOn: { ...chipBase, borderColor: '#39FF14', backgroundColor: 'rgba(57,255,20,0.1)' },
  chipText: { fontFamily: 'Inter', fontSize: 13, color: '#E6EDF3' },
  chipTextOn: { fontFamily: 'Inter', fontSize: 13, color: '#39FF14', fontWeight: '700' },
  ghost: { paddingVertical: 14, alignItems: 'center' },
  ghostText: { fontFamily: 'Inter', fontSize: 14, color: '#8B949E', fontWeight: '500' },
  errorBox: { marginTop: 20, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#F85149', backgroundColor: 'rgba(248,81,73,0.1)' },
  errorText: { fontFamily: 'Inter', fontSize: 13, color: '#F85149', textAlign: 'center' },
  errorHint: { fontFamily: 'Inter', fontSize: 12, color: '#8B949E', textAlign: 'center', marginTop: 4 },
  retry: { marginTop: 10, alignSelf: 'center', paddingVertical: 8, paddingHorizontal: 18, borderRadius: 999, backgroundColor: '#39FF14' },
  retryText: { fontFamily: 'Inter', fontSize: 14, fontWeight: '700', color: '#0D1117' },
});
```

- [ ] **Step 3 : Type-check + commit**

Run: `npx tsc --noEmit -p tsconfig.json` → OK.
```bash
git add app/onboarding/components/PlanBuilder.tsx app/onboarding/steps/PlanStep.tsx
git commit -m "feat(onboarding): écran Plan (génération + notif + finalize)"
```

---

# PHASE 3 — Câblage & nettoyage

## Task 19 : Brancher le routeur sur les 9 écrans

**Files:**
- Modify: `app/onboarding/index.tsx`

- [ ] **Step 1 : Réécrire le routeur**

```tsx
import React from 'react';
import { useOnboardingStore } from './hooks/useOnboardingStore';
import { HelloStep } from './steps/HelloStep';
import { LevelStep } from './steps/LevelStep';
import { DomainStep } from './steps/DomainStep';
import { GoalStep } from './steps/GoalStep';
import { TimeStep } from './steps/TimeStep';
import { DemoQuestionStep } from './steps/DemoQuestionStep';
import { ResultStep } from './steps/ResultStep';
import { SignupStep } from './steps/SignupStep';
import { PlanStep } from './steps/PlanStep';

export default function OnboardingRouter() {
  const currentStep = useOnboardingStore((s) => s.currentStep);

  switch (currentStep) {
    case 'hello':  return <HelloStep />;
    case 'level':  return <LevelStep />;
    case 'domain': return <DomainStep />;
    case 'goal':   return <GoalStep />;
    case 'time':   return <TimeStep />;
    case 'demo':   return <DemoQuestionStep />;
    case 'result': return <ResultStep />;
    case 'signup': return <SignupStep />;
    case 'plan':   return <PlanStep />;
    default:       return <HelloStep />;
  }
}
```

- [ ] **Step 2 : Type-check**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: peut encore référencer les anciens fichiers ailleurs → la Task 20 nettoie. Si erreurs uniquement sur fichiers à supprimer, continuer.

- [ ] **Step 3 : Commit**

```bash
git add app/onboarding/index.tsx
git commit -m "feat(onboarding): routeur branché sur les 9 nouveaux écrans"
```

---

## Task 20 : Supprimer les anciens fichiers

**Files:**
- Delete: `WelcomeStep.tsx`, `MindyIntroStep.tsx`, `DemoIntroStep.tsx`, `ResultsStep.tsx`, `NotificationsStep.tsx`, `finalize.ts`, `useDemoQuestions.ts`, `OnboardingScreen.tsx`

> Note : `SignupStep.tsx`, `DomainStep.tsx`, `GoalStep.tsx`, `TimeStep.tsx`, `DemoQuestionStep.tsx` sont **modifiés** (gardés). Ne supprimer QUE les fichiers listés ci-dessous.

- [ ] **Step 1 : Vérifier qu'aucun import résiduel ne pointe vers eux**

Run:
```bash
grep -rn "OnboardingScreen\|hooks/finalize'\|useDemoQuestions\|WelcomeStep\|MindyIntroStep\|DemoIntroStep\|ResultsStep\|NotificationsStep" app src
```
Expected: aucune occurrence hors des fichiers à supprimer. Corriger tout import résiduel avant suppression.

- [ ] **Step 2 : Supprimer**

```bash
cd mobile && git rm \
  app/onboarding/steps/WelcomeStep.tsx \
  app/onboarding/steps/MindyIntroStep.tsx \
  app/onboarding/steps/DemoIntroStep.tsx \
  app/onboarding/steps/ResultsStep.tsx \
  app/onboarding/steps/NotificationsStep.tsx \
  app/onboarding/hooks/finalize.ts \
  app/onboarding/hooks/useDemoQuestions.ts \
  app/onboarding/components/OnboardingScreen.tsx
```

- [ ] **Step 3 : Type-check + full test + commit**

Run: `npx tsc --noEmit -p tsconfig.json` → OK.
Run: `npx jest` → tous les `.spec.ts` passent.
```bash
git commit -m "chore(onboarding): supprimer les anciens écrans/utilitaires remplacés"
```

---

## Task 21 : Vérification manuelle sur device

**Files:** aucun (vérification)

- [ ] **Step 1 : Type-check global + tests**

Run: `npx tsc --noEmit -p tsconfig.json` → 0 erreur.
Run: `npx jest` → tout vert (store, demoQuestions, selectDemoQuestions, usernameSuggest, finalizeOnboarding).

- [ ] **Step 2 : Lancer l'app**

Run: `EXPO_PUBLIC_API_URL=https://mindy-api-zsvf.onrender.com/api npx expo start`
Puis scanner le QR avec Expo Go (ou `i` pour simulateur iOS).

- [ ] **Step 3 : Parcourir le flow complet et valider**

Checklist à cocher en testant :
- La **mascotte persiste** entre les écrans (ne disparaît/réapparaît pas), grande sur Hello puis plus petite.
- La **progress bar** est masquée sur Hello, visible ensuite, et se remplit jusqu'à 100% sur Plan.
- Le **typing** de Mindy s'anime et le bouton « Continuer » reste désactivé tant que le texte n'est pas fini.
- Sélection **niveau/domaine/objectif/temps** : carte sélectionnée surlignée vert, CTA activé seulement après choix.
- **Démo 3 questions** : bonne réponse → mascotte `hype` + flash vert + haptic ; mauvaise → `roast` + rouge + haptic ; explication affichée ; passe à la suivante.
- **Résultat** : compteur XP monte, barre se remplit.
- **Signup** : pseudo pré-rempli, validation live (bordure rouge si invalide).
- **Plan** : lignes terminal s'affichent une par une ; choisir une heure ; « Activer le rappel » → (1er appel = cold start ~40s, état loading visible) → arrive dans l'app `(tabs)`.
- **Robustesse** : couper le wifi sur l'écran Plan → message d'erreur + bouton « Réessayer » ; rallumer → réussit sans recréer de user.
- **Reprise** : tuer l'app au milieu → réouvrir → on revient à l'onboarding (état Zustand persisté).

- [ ] **Step 4 : Commit éventuel de correctifs**

Si des ajustements sont nécessaires après test, les committer avec des messages `fix(onboarding): ...`.

---

## Définition de « terminé »

- [ ] `npx jest` : tous les tests passent (incl. les 5 suites de logique : store, demoQuestions, selectDemoQuestions, usernameSuggest, finalizeOnboarding).
- [ ] `npx tsc --noEmit` : 0 erreur.
- [ ] Flow complet parcouru sur device, checklist Task 21 validée.
- [ ] Les 3 bugs corrigés vérifiés : push token (endpoint + platform + permission), création user unique, finalize idempotent.
- [ ] Aucun fichier mort restant (anciens steps/utilitaires supprimés).
