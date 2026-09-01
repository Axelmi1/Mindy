# Prompt à donner à Claude (design) pour générer le deck COMPLET de soutenance

> Copie-colle tout le bloc ci-dessous dans une session Claude (idéalement avec génération
> d'artifacts/slides). Remplis d'abord les `[À COMPLÉTER]`. Joins si possible :
> `MINDY_BRIEF.md`, les 6 visuels marketing, et des captures d'écran de l'app.

---

Tu es directeur artistique et consultant en pitch. Génère une **présentation de soutenance complète en français** (format slides HTML ou deck exportable, 16:9) pour **Mindy**, notre projet EDP à Epitech Digital School. Durée cible : **55 minutes de présentation** + questions. Le jury évalue : contexte, travail réalisé, organisation, marketing/business, démo.

## Identité visuelle (à respecter strictement)
- Fond `#0D1117` (noir GitHub), surfaces `#161B22`, texte `#E6EDF3`
- Accent principal **vert néon `#39FF14`** (titres clés, CTA, données fortes), secondaire bleu `#58A6FF`, or `#FFD700` pour l'XP/trophées
- Titres en style monospace (JetBrains Mono), texte en Inter
- Ton : jeune, direct, confiant — « le Duolingo du business », parallèle assumé
- **Mascotte : un cerveau vert néon 🧠 (PAS de hibou, PAS de logo/monogramme — le nom « MINDY » s'écrit toujours en texte monospace simple)**
- Peu de texte par slide, des chiffres énormes en néon, beaucoup de visuel

## Le produit (faits vérifiés — utilisables tels quels)
- **Mindy = le Duolingo des compétences business, en français** (crypto, finance, trading, immobilier, impôts, entrepreneuriat — l'argent n'est qu'une des verticales : le cœur, c'est monter en compétences). App mobile (React Native/Expo) + API (NestJS/PostgreSQL), déployée en continu (Render + EAS OTA : « un git push = tout se déploie »), testable par n'importe qui via Expo Go (QR code).
- **6 domaines** : Crypto, Finance, Trading, Immobilier, Impôts, Entrepreneuriat + une leçon Démo vitrine qui enchaîne **20 mécaniques d'exercices** (quiz, swipe, scénarios, calculatrice, prédiction de prix sur bougies, speed round, répartition de budget, chasse à l'arnaque, frise chronologique, analyse visuelle de graphique…).
- **Gamification complète** : XP, niveaux, séries (streak) + streak freeze + **rachat de série (48h, 100 XP)**, combos, **quêtes du jour** avec récompenses à réclamer, ligues hebdomadaires (Fer→Platine), ~40 succès (Common→Legendary), **boutique d'avatars** payables en XP.
- **Social** : amis, **classement hebdo général ET entre amis**, **défis 1v1** sur une leçon avec revanche, parrainage (XP des deux côtés), **partage du résultat de leçon en image brandée** (stories).
- **Onboarding** personnalisé en 9 étapes (niveau, domaine, objectif, temps/jour, quiz démo qui crédite les premiers XP).
- **Monétisation Stripe (freemium)** : Free (5 leçons/jour) · **Pro 9,99 $/mois** (leçons illimitées, parcours personnalisé, 10 streak freezes, hors-ligne, export PDF) · **Pro annuel 79,99 $/an (−33 %)**.
- **Back-office analytics** : DAU/WAU/MAU, rétention D1/D7/D30, funnel signup→Pro, export CSV.
- **Qualité** : ~365 tests backend automatisés, TypeScript strict de bout en bout, auth JWT + bcrypt, API sécurisée par défaut.

## Règles d'honnêteté (OBLIGATOIRES)
- L'app est en **pré-lancement/test** : n'invente AUCUN chiffre de traction Mindy (utilisateurs, MRR, conversion). Tout chiffre business est présenté comme **objectif/hypothèse**.
- Les chiffres de marché doivent être **sourcés** (recherche web : taille EdTech, adoption crypto 18-30 ans France, illettrisme financier OCDE/Banque de France). Cite tes sources sur la slide.
- Les zones `[À COMPLÉTER]` sont à remplir par nous, laisse des placeholders visibles si l'info manque.

## Plan imposé par l'école (structure du deck)

**1. Introduction (5 min, ~5 slides)** — accroche (le problème : les 18-30 ans veulent monter en compétences business — argent, crypto, entrepreneuriat — mais l'offre est scolaire, éparpillée ou anxiogène), le sujet et l'idée, contexte marché avec 3 chiffres clés sourcés, concurrents (Duolingo comme modèle ; Binance Academy/Coinbase Learn/Finary comme voisins — aucun ne combine crypto+finance / format Duolingo / français mobile-first), pourquoi ce projet (le « white space »).

**2. Travail & résultats (45 min, ~25-30 slides)**
- **Timeline du projet** : conception & DA → socle technique (monorepo, CI/CD) → moteur de leçons & progression → gamification (séries, ligues, succès, quêtes) → social (amis, défis 1v1, parrainage) → monétisation Stripe → analytics → refonte onboarding → francisation → auth sécurisée → nouveaux domaines (Immobilier/Impôts/Entrepreneuriat) + Master Quiz → features de viralité (partage d'image, classement amis, boutique). Dates réelles `[À COMPLÉTER]`.
- **Production & documentation** : architecture (schéma monorepo server/mobile/shared), le pipeline « 1 git push = API déployée + OTA mobile », la validation de contenu (Zod) et les ~365 tests.
- **Organisation** : méthode, outils, répartition des rôles `[À COMPLÉTER PAR L'ÉQUIPE]`.
- **Difficultés → solutions** (exemples réels : migration auth sans mot de passe → JWT/bcrypt ; étapes de leçons legacy qui crashaient le lecteur → schéma validé par tests + normalisation ; cold start Render en démo → warm-up ; contenu coûteux à produire → générateur de leçons validé par schéma). `[Compléter avec les blocages vécus]`
- **Promotion extérieure** : la stratégie réseaux (6 visuels dark/néon existants : positionnement « Le Duolingo du business », hook TikTok, série, carrousel 3 erreurs, défis entre potes, story produit), calendrier de publication, et résultats mesurés `[À COMPLÉTER : vraies stats ou présenter comme plan]`.
- **Bilan vs objectifs** : prévu/réalisé/pivots `[À COMPLÉTER]`.
- **Stratégie marketing (le cœur)** :
  - **BMC** centré persona/proposition de valeur — persona principal « Léo, 18-25 ans, veut monter en compétences business (crypto, investissement, entrepreneuriat), peur de se faire avoir, mobile-first » ; proposition : apprendre sans s'ennuyer, 10 min/jour, en français, format jeu.
  - **SWOT** : Forces (produit complet déployé, différenciation FR, stack pro, boucles virales intégrées) / Faiblesses (pré-lancement, notoriété nulle, équipe étudiante, coût du contenu) / Opportunités (adoption crypto, vide concurrentiel FR, B2B écoles, partenariats fintech) / Menaces (gros acteur qui se lance, image « crypto », régulation, CAC mobile élevé).
  - **Roadmap 3 ans** (commercial + technique) : An 1 lancement stores + acquisition organique TikTok/parrainage + enrichissement catalogue ; An 2 IA de parcours, créateurs de contenu, partenariats fintech, EN ; An 3 B2B écoles/entreprises, expansion. 
  - **Business plan 3 ans** : hypothèses explicites (funnel téléchargements→inscrits→actifs→Pro, prix 9,99/79,99 $, conversion cible 2-4 %, coûts infra ~0-50 €/mois puis échelle, contenu, acquisition) → tableau revenus/coûts/résultat par année, point mort. Tout étiqueté « prévisionnel ».
  - **Exemples concrets de posts** : les **6 visuels marketing sont fournis en pièces jointes — INTÈGRE-LES directement dans les slides** (section promotion + stratégie de com), chacun avec sa légende et son réseau cible.
- **Démo (slide de transition + filet de sécurité)** : le parcours live = onboarding personnalisé → leçon Démo « Le tour de Mindy en 20 exercices » → +XP/succès/confetti → partage d'image → boutique d'avatars → classement Amis → défi 1v1 → (si le temps) back-office analytics. Prévois une slide « plan B » avec captures d'écran au cas où le réseau lâche, et une slide QR code « testez pendant qu'on parle » (Expo Go).

**3. Conclusion (5 min, 2-3 slides)** — bilan (fierté du produit fini et déployé), limites honnêtes, ouverture (suite de l'année : lancement stores, premiers testeurs, B2B).

**4. Slide « Questions »** avec le QR de test et le récap des chiffres clés.

## Contraintes de sortie
- Chaque slide : titre percutant + 3-5 points max + suggestion visuelle (schéma, capture, chiffre néon géant).
- Ajoute des **notes de présentation** (qui parle, quoi dire, timing) sous chaque slide — toute l'équipe doit pouvoir défendre chaque partie. Répartition des 4 membres sur les sections `[À COMPLÉTER : prénoms]`.
- Total ~35-40 slides, rythme 60-90 s/slide.
