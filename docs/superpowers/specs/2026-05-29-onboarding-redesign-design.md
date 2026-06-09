# Refonte de l'onboarding Mindy — Design

**Date :** 2026-05-29
**Statut :** Validé (brainstorming) — en attente de relecture utilisateur
**Périmètre :** Mobile uniquement (`mobile/app/onboarding/`). Zéro changement backend.

---

## 1. Objectif

Recoder de zéro l'onboarding de Mindy avec deux buts :

1. **Plus beau / plus pro** — refonte visuelle complète autour du concept « Mindy te coache ».
2. **Plus robuste** — corriger les bugs réels du parcours actuel et durcir la finalisation.

Mindy est une app éducative « Duolingo pour la crypto & la finance » (projet scolaire mono-dev),
esthétique dark/neon « coder vibe » (`#0D1117` + vert `#39FF14`), avec une mascotte SVG animée
à 4 humeurs (`neutral` / `hype` / `roast` / `thinking`).

## 2. Concept directeur : « Mindy te coache »

L'onboarding est une **conversation** avec la mascotte, du premier au dernier écran.
Mindy parle (terminal-style typing), pose les questions, réagit aux réponses (change d'humeur),
chambre quand c'est faux, félicite quand c'est juste.

**Traitement visuel retenu : Hybride.**
- Grande mascotte animée en haut qui réagit (moods).
- Message de Mindy en style terminal (`[MINDY]>` + curseur clignotant).
- Réponses de l'utilisateur en cartes soignées.

## 3. Flow (9 écrans, 4 phases)

Au lieu des 12 étapes actuelles. Mindy parle partout et change d'humeur.

### ① Accroche
1. **Hello** *(mood: hype)* — Mindy se présente en grand. « Salut, moi c'est Mindy. En 2 min
   je te montre comment devenir bon en argent. » Boutons : « C'est parti » / « J'ai déjà un compte ».
2. **Niveau** *(nouveau)* — « T'es plutôt… ? » → débutant total / je connais 2-3 trucs / je gère déjà.
   Calibre le ton de Mindy **et** la difficulté des questions démo.

### ② On te connaît
3. **Domaine** — ⛓️ Crypto · 💰 Finance · ✨ Les deux. (Icône crypto = **blockchain ⛓️**, pas ₿.)
4. **Objectif** — Investir · Comprendre les bases · Carrière · Curiosité. Mindy réagit à chaque choix.
5. **Temps / jour** — 5 / 10 / 15 min. Mindy : « 5 min suffisent si tu reviens tous les jours 🔥 ».

### ③ Le « aha » (essai réel)
6. **Mini-leçon live (3 questions)** — *cœur du parcours.* Démo interactive relookée hybride.
   Mindy réagit à chaque réponse (`hype` si juste / `roast` si faux), explication courte.
   Questions adaptées au **domaine + niveau** choisis.
7. **Résultat + 1ère XP** *(confetti)* — « X/3 ! Tu viens de gagner tes premiers +XP 🎉 ».
   Compteur XP qui monte + barre de niveau qui se remplit. Shot de dopamine avant le signup.

### ④ On scelle
8. **Pseudo** — pré-rempli/suggéré (ex. `@satoshi_4f2`), éditable. Email optionnel (sauvegarde).
   **C'est ici que le compte se crée** (après l'accroche émotionnelle).
9. **Plan** *(nouveau, mood: thinking)* — Mindy « génère » le parcours sous les yeux de l'utilisateur
   (lignes terminal qui s'affichent une par une) + propose une notif quotidienne (commitment).
   « Demain 9h je te rappelle ? » → entrée dans l'app.

## 4. Architecture & state

### Coquille conversationnelle persistante
La mascotte + la progress bar vivent dans `onboarding/_layout.tsx` (pas dans chaque step).
Seul le bloc message + réponses est rendu par l'étape active et animé en entrée/sortie.
Effet « conversation continue » : la mascotte ne re-fade pas entre les écrans.

Composant `MindyTurn` : structure commune d'un écran. Chaque step ne fournit que :
- le `mood` de Mindy,
- son `message`,
- le contenu des réponses (slot),
- l'état d'activation du bouton « Continuer ».

Tout le reste (layout, anim d'entrée, progress, bouton) est factorisé.

### State
- **Zustand + persistance AsyncStorage** (conservé — survit au kill d'app pendant l'onboarding).
- Clé existante `@mindy/onboarding_state`, vidée après finalisation.
- Champs : `domain`, `goal`, `dailyMinutes`, `level` *(nouveau)*, `demoScore`, `demoAnswers`,
  `username`, `email`, `notificationsEnabled`, `reminderHour`.
- `STEP_ORDER` mis à jour pour les 9 étapes.

### Création du compte unifiée
- Une seule source de vérité : `finalizeOnboarding()`.
- `useUser.initUser()` **ne crée plus** de user pendant l'onboarding (suppression du double chemin
  de création qui diverge aujourd'hui sur la génération d'email).

## 5. Direction visuelle & animations

- **Mascotte vivante** : 4 moods pilotés par l'interaction (`neutral` questions, `hype` succès/accroche,
  `roast` erreur, `thinking` génération). Float permanent + petit rebond au changement de mood.
- **Typing terminal-style** généralisé à tous les écrans (`[MINDY]>` + curseur). Bouton « Continuer »
  désactivé tant que le typing n'est pas terminé (force la lecture).
- **Transitions** : mascotte + progress bar **persistent** entre écrans (dans le layout) ; seul le bloc
  message/réponses glisse/fade.
- **Moments clés** :
  - bonne réponse démo → mascotte `hype` + flash vert + haptic success ;
  - mauvaise → mascotte `roast` + shake léger + haptic warning ;
  - résultat (étape 7) → confetti + compteur XP + barre de niveau ;
  - plan (étape 9) → mascotte `thinking` + lignes terminal qui « build » le parcours.
- **Gotchas respectés** (mémoire projet) : `TouchableOpacity` + styles statiques (pas de
  `Pressable` + style-fn) ; pas de `SafeAreaProvider`.

## 6. Robustesse

### Bugs confirmés à corriger (côté mobile)
1. **Push token cassé** — `finalize.ts:87` appelle `POST /notifications/register` qui n'existe pas.
   Vrai endpoint = `POST /notifications/register-token`, qui exige `platform` (`IOS`/`ANDROID`).
   → corriger l'URL + mapper `Platform.OS` → enum, envoyer le payload complet.
2. **`getExpoPushTokenAsync()` plante** — appelé sans demander la permission ni passer le `projectId`.
   → demander la permission explicitement, passer le `projectId` (depuis la config Expo) ;
   si refus/échec → continuer sans bloquer.
3. **Double création de user** — `finalize.ts` et `useUser.initUser()` créent un user avec des règles
   d'email différentes. → `finalizeOnboarding` devient l'unique chemin de création en onboarding.

### Durcissement
4. **Finalize idempotent** — si un `@mindy/user_id` existe déjà (user créé mais étape suivante plantée),
   reprendre sans recréer (pas d'orphelins). S'appuie sur la persistance précoce de l'id déjà en place.
5. **Échecs réseau visibles** — étape 8 : si la création échoue, message clair + bouton « Réessayer »
   (au lieu de rester bloqué). Cold-start Render (~42 s) couvert par un timeout généreux + état
   « Mindy réfléchit… ».
6. **Pseudo déjà pris (409)** — comportement conservé + suggestion d'un pseudo libre.

### Hors scope
- **Aucun changement backend.** Endpoints vérifiés présents : `POST /notifications/register-token`,
  `PATCH /users/:id`, `POST /auth/magic-link`, `POST /users`.

## 7. Découpage des fichiers

```
mobile/app/onboarding/
  _layout.tsx              → coquille persistante (mascotte + progress + transitions)
  index.tsx                → routeur d'étapes (switch sur currentStep)
  hooks/
    useOnboardingStore.ts  → Zustand (+ champ level, STEP_ORDER 9 étapes)
    finalizeOnboarding.ts  → création user idempotente + prefs + push + magic-link
  components/
    MindyTurn.tsx          → structure d'un écran (mood + message + slot réponses + bouton)
    AnswerCards.tsx        → cartes de choix réutilisables (niveau/domaine/objectif/temps)
    XpReveal.tsx           → confetti + compteur XP + barre niveau (étape 7)
    PlanBuilder.tsx        → animation « Mindy génère ton plan » (étape 9)
  steps/
    HelloStep, LevelStep, DomainStep, GoalStep, TimeStep,
    DemoStep (3 questions), ResultStep, SignupStep, PlanStep
  data/
    demoQuestions.ts       → banque de questions (adaptée domaine + niveau)
```

Chaque step = un petit fichier décrivant uniquement mood + message + contenu. La mécanique vit dans
`MindyTurn` et le layout.

## 8. Stratégie de test

- **Logique pure (priorité, en TDD)** :
  - `finalizeOnboarding` — idempotence, mapping `platform`, gestion 409 / échec réseau (fetch mocké) ;
  - sélection des questions démo selon domaine + niveau ;
  - scoring / calcul XP.
- **Rendu de base des steps** — montage sans crash (snapshot léger).
- **Pas de tests d'animation** (fragile, peu rentable).
- **Vérification manuelle sur device** via Expo Go pour le ressenti (transitions, moods, confetti).

## 9. Données collectées (rappel)

`level` (nouveau), `domain`, `goal`, `dailyMinutes`, `demoScore`/`demoAnswers`, `username`,
`email` (optionnel), `notificationsEnabled`, `reminderHour`.

Persistance API à la finalisation :
- `POST /users` → `{ username, email? }`
- `PATCH /users/:id` → `{ preferredDomain, userGoal, dailyMinutes, reminderHour }`
- `POST /notifications/register-token` → `{ userId, token, platform }` (si notifs activées)
- `POST /auth/magic-link` → `{ userId, email }` (si email fourni)

> Note : `level` est collecté pour piloter la difficulté de la démo et le ton de Mindy.
> Il n'est pas persité côté backend dans ce périmètre (pas de champ dédié ; hors scope backend).
> S'il faut le sauvegarder plus tard, ce sera un ajout backend séparé.
