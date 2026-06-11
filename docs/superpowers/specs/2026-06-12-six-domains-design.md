# Six domaines d'apprentissage — Design

**Date :** 2026-06-12
**Branche :** `feat/onboarding-redesign`
**Statut :** Approuvé (décisions prises) — relecture spec en attente

## 1. Contexte & objectif

L'app a aujourd'hui **3 domaines** de leçons (`Domain` enum : `CRYPTO`, `FINANCE`, `TRADING`). Pour la soutenance, on en ajoute **3** pour montrer l'ampleur du produit :

| Token enum | Label FR | Icône | Couleur |
|---|---|---|---|
| `REAL_ESTATE` | Immobilier | 🏠 | `#A371F7` (violet) |
| `ENTREPRENEURSHIP` | Entrepreneuriat | 🚀 | `#FF7B72` (corail) |
| `TAXES` | Impôts | 🧾 | `#E3B341` (or) |

**Décisions (validées) :**
- **Profondeur** : les 6 domaines visibles partout + **1 vraie leçon démo jouable** par nouveau domaine.
- **Onboarding** : étendu aux **6 domaines** comme choix de départ (+ une option « Un peu de tout » = `BOTH`).
- **Vitrine démo** : l'**onglet Apprendre** (catalogue) — sélecteur à 6 domaines, chacun coloré/iconisé.

**Problème existant traité au passage (DRY) :** le mapping `domaine → couleur/label/icône` est aujourd'hui **hardcodé en ternaires incohérents** dans ≥ 5 fichiers (Crypto = vert dans `LessonCard`, orange dans `learn.tsx`/`settings`). On crée **une seule source de vérité**.

## 2. Non-objectifs

- Pas de jeu complet de leçons par nouveau domaine (1 leçon démo chacun seulement).
- Pas de parité totale des Réglages (le sélecteur de domaine préféré des Réglages n'est pas la vitrine ; mise à jour minimale only).
- Pas de suppression possible des valeurs d'enum après coup (Postgres : ajout d'enum facile, retrait coûteux — voir Risques).

## 3. Changements par couche

### 3.1 Backend (`server/`)
- **`prisma/schema.prisma`** — `enum Domain` += `REAL_ESTATE`, `ENTREPRENEURSHIP`, `TAXES`. (Appliqué en prod par `prisma db push` au build Render — ajout de valeurs d'enum = additif/sûr.)
- **`src/lessons/lesson-content.schema.ts`** — dans `CreateLessonSchema` ET `UpdateLessonSchema`, le `domain: z.enum(['CRYPTO','FINANCE','TRADING'])` passe à `z.enum(['CRYPTO','FINANCE','TRADING','REAL_ESTATE','ENTREPRENEURSHIP','TAXES'])` (sinon créer/valider une leçon d'un nouveau domaine est rejeté).
- **`src/auth/auth.controller.ts`** — `RegisterSchema.preferredDomain` : `z.enum(['CRYPTO','FINANCE','BOTH'])` → ajouter les 4 valeurs manquantes : `['CRYPTO','FINANCE','TRADING','REAL_ESTATE','ENTREPRENEURSHIP','TAXES','BOTH']` (l'onboarding peut désormais envoyer un des 6 domaines).

### 3.2 Shared (`shared/`)
- **`types/lesson.ts`** — `export type Domain = 'CRYPTO' | 'FINANCE' | 'TRADING'` += les 3 nouveaux tokens.
- **`types/api.ts`** — `CreateUserDto.preferredDomain` et `RegisterDto.preferredDomain` : l'union `'CRYPTO' | 'FINANCE' | 'BOTH'` passe à `'CRYPTO' | 'FINANCE' | 'TRADING' | 'REAL_ESTATE' | 'ENTREPRENEURSHIP' | 'TAXES' | 'BOTH'`.
- **Rebuild `dist`** (`cd shared && npm run build`) pour que le mobile voie les nouveaux types.

### 3.3 Mobile (`mobile/`)
- **Nouveau `src/data/domains.ts`** — source unique de vérité :
  ```ts
  import type { Domain } from '@mindy/shared';
  export interface DomainMeta { label: string; sublabel: string; color: string; icon: string; }
  export const DOMAINS: Record<Domain, DomainMeta> = {
    CRYPTO:           { label: 'Crypto',         sublabel: 'Bitcoin, blockchain, DeFi',   color: '#F7931A', icon: '₿' },
    FINANCE:          { label: 'Finance',        sublabel: 'Investir, budget, bourse',     color: '#3FB950', icon: '💰' },
    TRADING:          { label: 'Trading',        sublabel: 'Marchés, bougies, risque',     color: '#58A6FF', icon: '📊' },
    REAL_ESTATE:      { label: 'Immobilier',     sublabel: 'Acheter, louer, investir',     color: '#A371F7', icon: '🏠' },
    ENTREPRENEURSHIP: { label: 'Entrepreneuriat',sublabel: 'Lancer & gérer un business',   color: '#FF7B72', icon: '🚀' },
    TAXES:            { label: 'Impôts',          sublabel: 'Fiscalité, déclarations',      color: '#E3B341', icon: '🧾' },
  };
  export const DOMAIN_ORDER: Domain[] = ['CRYPTO','FINANCE','TRADING','REAL_ESTATE','ENTREPRENEURSHIP','TAXES'];
  ```
  (Couleur Finance déplacée du vert néon de marque `#39FF14` vers un vert distinct `#3FB950` pour ne pas confondre identité de marque et couleur de domaine — ajustable.)
- **`app/(tabs)/learn.tsx`** — élargir le `type Domain` local (ou l'importer du shared) ; remplacer **tous** les ternaires `domainLabel`/`domainColor`/`domainIcon` (lignes ~119, ~410, etc.) par des lookups dans `DOMAINS` ; alimenter le **sélecteur de domaines** à partir de `DOMAIN_ORDER` (6 onglets) ; gérer l'état « domaine sans leçon » proprement (les 3 nouveaux ont 1 leçon démo, donc non vides).
- **`src/components/ui/LessonCard.tsx`** & **`ContinueCard.tsx`** — élargir `domain: 'CRYPTO' | 'FINANCE'` → `Domain` ; remplacer la couleur binaire `domain === 'CRYPTO' ? vert : bleu` par `DOMAINS[domain].color` (+ label/icône depuis le map).
- **`src/api/client.ts`** — `getByDomain(domain: 'CRYPTO' | 'FINANCE', ...)` → `domain: Domain`.
- **Onboarding `app/onboarding/steps/DomainStep.tsx`** — proposer les **6 domaines** (via `DOMAIN_ORDER` + `DOMAINS`) + une carte « Un peu de tout » (`BOTH`). Le `onSelect` écrit `preferredDomain`.
- **`app/onboarding/hooks/useOnboardingStore.ts`** — le type local `Domain = 'CRYPTO' | 'FINANCE' | 'BOTH'` passe à `Domain (shared) | 'BOTH'` (les 6 tokens + `BOTH`). `finalizeOnboarding` envoie déjà `preferredDomain: state.domain` → accepté par le `RegisterSchema` élargi.
- **`app/settings.tsx`** (minimal) — `DomainValue` inclut déjà `TRADING`/`BOTH` ; ajouter les 3 nouveaux au `DOMAIN_OPTIONS` pour cohérence (sinon un utilisateur ayant choisi Immobilier ne le verrait pas dans les Réglages). Réutiliser `DOMAINS` plutôt que redéfinir emoji/couleur.

### 3.4 Contenu — 3 leçons démo (script idempotent, NON destructif)
- **Nouveau `server/prisma/add-domain-lessons.ts`** — script `ts-node` qui fait `prisma.lesson.upsert({ where: { id: <id fixe> }, create, update })` pour 3 leçons (ids stables type `'demo-real-estate-001'`). **Aucun `deleteMany`** → ne touche pas aux users (≠ `seed.ts`). Idempotent (re-lançable). Lancé **une fois** contre Neon (`DATABASE_URL`).
- Chaque leçon : `domain` = le nouveau token, `difficulty: BEGINNER`, `xpReward: 75`, `orderIndex: 1`, `content` valide selon `LessonContentSchema` (étapes `info` → `quiz` → `swipe`).

Contenu (FR, exact, niveau débutant) :

**🏠 Immobilier — « Acheter ou louer ? »**
- `info` : louer = flexibilité/pas d'apport ; acheter = se constituer un patrimoine mais frais (notaire ~7–8% dans l'ancien) et engagement long.
- `quiz` : « Quel est l'ordre de grandeur des frais de notaire dans l'ancien ? » → ~7–8 % (vs 2–3 % neuf).
- `swipe` (vrai/faux) : « Acheter est toujours plus rentable que louer. » → Faux (dépend de la durée de détention, du marché, des frais).

**🚀 Entrepreneuriat — « Lancer son business : les bases »**
- `info` : valider le besoin avant de coder/produire ; notion de MVP ; revenus > charges.
- `quiz` : « Que valide un MVP ? » → qu'un vrai besoin existe / que des gens veulent payer.
- `swipe` : « Il faut une idée 100% originale pour réussir. » → Faux (l'exécution > l'idée).

**🧾 Impôts — « Comprendre tes impôts »**
- `info` : impôt sur le revenu progressif par tranches ; différence brut/net ; prélèvement à la source.
- `quiz` : « Le barème de l'impôt sur le revenu est… » → progressif par tranches (pas un taux unique).
- `swipe` : « Passer dans la tranche supérieure fait baisser ton net global. » → Faux (seule la part au-dessus du seuil est taxée plus).

## 4. Flux de données
Catalogue (learn tab) → `lessonsApi.getAll()` → filtre par `selectedDomain` (∈ 6) → rend le parcours. Couleur/label/icône partout via `DOMAINS[domain]`. Onboarding → `preferredDomain` ∈ {6 domaines, BOTH} → `POST /auth/register` (Zod élargi) → stocké (`String?`). Leçons démo : ajoutées en base via le script idempotent.

## 5. Déploiement
1. Merge `main` → Render rebuild → `prisma db push` ajoute les valeurs d'enum (additif) ; OTA EAS publie le mobile.
2. Lancer **une fois** `npx ts-node prisma/add-domain-lessons.ts` contre Neon (ajoute les 3 leçons, non destructif).
3. (Le `JWT_SECRET` doit rester configuré côté Render — prérequis existant.)

## 6. Tests
- **Backend** : un spec qui `validateLessonContent` les 3 contenus démo (ils parsent) + `CreateLessonSchema` accepte les nouveaux domaines.
- **Shared/Mobile** : `tsc --noEmit` propre des deux côtés ; suites existantes vertes. Petit test : `DOMAINS` contient exactement les 6 clés de `Domain` et `DOMAIN_ORDER` les couvre.
- **Manuel** : onboarding montre 6 (+Tout) ; learn tab affiche 6 onglets colorés ; ouvrir une leçon Immobilier/Entrepreneuriat/Impôts fonctionne.

## 7. Risques & limites
- **Enum Postgres** : ajouter des valeurs est sûr/additif ; **les retirer ensuite est pénible** (recréation de type). Choisir les 3 tokens définitivement.
- **Script contenu** : touche la base Neon (mais **non destructif** et idempotent). À lancer manuellement, pas au build.
- **Domaines quasi vides** : 1 leçon chacun → parcours très court ; acceptable pour la démo (assumé).
- **Couleurs** : la palette domaine est ajustable ; veiller au contraste sur fond `#0D1117`.
