# Prompt — Agent animations & assets (Claude Code, Sonnet 5)

> Copie tout le bloc ci-dessous comme premier message d'une session Claude Code
> ouverte dans `/Users/axelmisson/mindy_final`. Complète d'abord la section
> « Feedbacks reçus » avec les retours exacts si tu en as de plus précis.

---

Tu travailles sur **Mindy**, une app mobile française type « Duolingo du business » (crypto, finance, trading, immobilier, impôts, entrepreneuriat). Monorepo : `server/` (NestJS + Prisma + Postgres), `mobile/` (**Expo SDK 57, React Native 0.86, React 19.2, expo-router 57, Reanimated 4.5, TypeScript strict**), `shared/` (types partagés). L'app est en prod : **un `git push` sur `main` déploie l'API (Render) ET publie une OTA mobile (EAS Update, canal preview)** — tout ce que tu pousses arrive sur les téléphones de test en ~3 min. Travaille en conséquence : petits commits vérifiés, jamais de push cassé.

## Ta mission (2 volets)

### Volet A — Améliorer les animations (feedbacks utilisateurs)

**Feedbacks reçus** : les animations manquent ou sont raides sur le **dashboard (accueil)** et la **nav bar**. `[Détails supplémentaires à compléter par Axel si besoin]`

Chantiers, par priorité :

1. **Nav bar** (`mobile/app/(tabs)/_layout.tsx`) : les 4 onglets ont des icônes animées custom — rends la transition d'onglet vivante : scale + spring sur l'icône active, halo/glow néon `#39FF14` animé, indicateur de sélection fluide (pill ou dot qui glisse), léger retour haptique (`expo-haptics`, déjà utilisé dans le projet). Le badge de défis en attente peut « pop » (spring) quand son compte change.
2. **Dashboard** (`mobile/app/(tabs)/index.tsx`, ~1300 lignes) : stagger d'entrée cohérent (les cartes utilisent déjà `FadeInDown.delay(...)` — harmonise les delays), compteurs animés pour XP/série (un composant `XpCounter` existe déjà dans `mobile/src/components/animations/`), pulse doux sur la flamme de série, micro-interaction à l'appui sur les cartes (scale 0.97 spring), animation de « réclamation » gratifiante sur `DailyQuestsCard` (`mobile/src/components/ui/DailyQuestsCard.tsx`) : la barre se remplit, le bouton éclate en particules/checkmark.
3. **Écran leçon** (`mobile/app/lesson/[id].tsx`) : transitions entre étapes plus fluides si tu vois des à-coups ; les célébrations existent (`Confetti`, `LevelUpCelebration`, `StreakFire` dans `mobile/src/components/animations/`) — réutilise-les plutôt que d'en recréer.
4. **Boutique** (`mobile/app/shop.tsx`) et **classement** (`mobile/app/(tabs)/leaderboard.tsx`) : entrées en stagger, achat d'avatar avec une petite célébration.

**Règles d'animation** : Reanimated 4.5 uniquement (`useSharedValue`, `withSpring`, `withRepeat`, entering/exiting) — pas de nouvelle lib d'animation, pas d'`Animated` legacy pour du neuf. 60 fps : rien de coûteux dans le thread JS, pas d'animation de layout massives sur les longues listes. Respecte le style existant du code (français dans les commentaires/commits).

### Volet B — Générer les assets mascotte (Higgsfield) et les intégrer

La mascotte officielle est un **cerveau vert néon cartoon** (PAS de hibou, PAS de logo — « MINDY » s'écrit en texte). Un kit de 21 assets a déjà été généré ; s'il n'est pas déjà déposé dans `mobile/assets/mascot/`, régénère-les avec le MCP Higgsfield (`generate_image_batch`, modèle `nano_banana_pro`, ratio 1:1) avec ce prompt maître :

> Mascot design for a French fintech learning app. A cute cartoon brain character, neon green (#39FF14) with soft glow, big round glossy eyes, small friendly smile, simple rounded shapes, thick dark outlines, flat 2D vector style with subtle inner shading. [POSE]. Pure flat dark background #0D1117, no gradients, no text, no letters, no watermark, no logo. Centered, full body visible.

**Technique de cohérence obligatoire** : génère d'abord la pose neutre (`standing pose, waving one hand`), puis passe son `job_id` en référence (`medias: [{value: <job_id>, role: "image"}]`) pour toutes les autres poses avec « Same exact cartoon brain mascot character as the reference image… ». Poses utiles à l'app : neutre, coach (casque), célébration (trophée), réflexion (menton), streak (anneau de feu), endormi (zzz), fier (couronne), freeze (cube de glace).

**Intégration dans l'app** :
1. **Optimise chaque PNG avant de l'embarquer** : ≤ 512×512, PNG optimisé (< 150 KB par fichier) — ces assets partent dans le bundle OTA, pas de 5 MB. Range-les dans `mobile/assets/mascot/`.
2. **Remplace la mascotte actuelle** : `mobile/src/components/mindy/` contient le composant Mindy avec 4 humeurs (utilisé par `MindyMessage`, l'onboarding via `MindyTurn`, le lecteur de leçon). Mappe les humeurs existantes vers les nouvelles images (neutral → neutre, hype → célébration, roast/curious → réflexion, etc.) en gardant l'API du composant identique pour ne rien casser ailleurs. Ajoute une petite animation d'apparition (spring scale + float loop léger).
3. Points d'intégration bonus si le temps : mascotte endormie sur l'état vide « pas de leçon », mascotte couronne sur le paywall Pro, mascotte freeze près du streak freeze dans le profil.

## Les pièges connus de CE projet (retours d'expérience, ne les redécouvre pas)

- **Expo Go SDK 57** : n'ajoute AUCUN module natif hors de ceux inclus dans Expo Go, sinon l'app de démo casse. Reanimated, expo-haptics, expo-image et lottie-react-native sont inclus ; dans le doute, vérifie.
- **`npm install` exige `--legacy-peer-deps`** (un `.npmrc` le règle pour EAS, mais pense-y en local).
- **Pressable + fonction de style ont déjà posé problème** dans ce projet → préfère `TouchableOpacity` + styles statiques, ou Pressable avec styles fixes.
- Pas de SafeAreaProvider à ajouter — le projet utilise `SafeAreaView` de `react-native-safe-area-context` tel quel.
- `expo-av` a été retiré (remplacé par `expo-audio`) — ne le réintroduis pas.
- Les couleurs : fond `#0D1117`, surface `#161B22`, néon `#39FF14`, or `#FFD700`, bleu `#58A6FF` (`mobile/src/theme/theme.ts`), mais beaucoup d'écrans les écrivent en dur — suis le style du fichier que tu modifies.

## Vérification obligatoire avant CHAQUE commit/push

```bash
cd mobile && npx tsc --noEmit && npm test
```

et avant le push final :

```bash
cd mobile && npx expo export --platform ios --output-dir /tmp/export-test
```

(le bundle complet doit passer — c'est le smoke test du projet). Serveur non touché normalement ; si tu y touches : `cd server && npx tsc --noEmit && npm test` (366 tests, tout doit rester vert).

## Commits

Style du repo : conventional commits **en français**, un commit par chantier cohérent, message qui explique le pourquoi. Exemples réels : `feat(quests): quêtes du jour avec récompenses XP à réclamer`, `fix(leaderboard): supprimer l'écran stack doublon`. Pousse sur `main` seulement quand tsc + tests + export passent — chaque push déclenche l'OTA que les testeurs reçoivent.

## Définition de « fini »

- Nav bar et dashboard nettement plus vivants (springs, staggers, compteurs, glow) sans perte de fluidité.
- Réclamation de quête et achat d'avatar gratifiants.
- Mascotte cerveau intégrée via `mobile/src/components/mindy/` (API inchangée), assets optimisés < 150 KB pièce dans `mobile/assets/mascot/`.
- `tsc` propre, 51+ tests mobiles verts, `expo export` OK, tout poussé.
