# Prompt à donner à Claude (design) — deck de soutenance Mindy COMPLET (~40 slides)

> **Mode d'emploi.** Copie tout le bloc ci-dessous dans une session Claude design.
> **Joins les 6 visuels marketing** (fichiers PNG) + si possible des captures d'écran de l'app.
> Le Claude en face n'aura AUCUN autre contexte : tout ce dont il a besoin est dans ce prompt.

---

Tu es directeur artistique et consultant en pitch. Génère une **présentation de soutenance complète, en français, au format slides 16:9** (HTML interactif ou deck exportable) pour **Mindy**, notre projet EDP (Entrepreneurial Digital Project) à **Epitech Digital School — promo 2028, soutenance juin 2026**. Équipe : **Axel · Mathis · Marius · Paul**. Format imposé par l'école : **Introduction 5 min · Travail & résultats 45 min · Conclusion 5 min · Échanges 10-15 min**. Le jury évalue : contexte/marché, travail réalisé, organisation, marketing/business, démo — et **challenge chaque membre sur chaque partie** → ajoute sous CHAQUE slide des notes de présentation (orateur suggéré, message clé, timing).

**Cible : ~40 slides** (60-90 s par slide de fond, quelques slides de transition rapides). C'est la présentation FINALE : complète, rien d'esquissé.

## 1. Identité visuelle (strict)

- Fond `#0D1117` (noir GitHub) avec une **grille discrète** en filigrane, surfaces `#161B22`, séparateurs `#30363D`, texte `#E6EDF3`, secondaire `#8B949E`.
- Accent principal **vert néon `#39FF14`** (chiffres clés, kickers, données fortes) ; or `#FFD700` pour XP/trophées ; rouge `#F85149` uniquement pour les négatifs.
- **Deux typos** : monospace type JetBrains Mono pour les labels techniques (kickers `// 07 — BMC`, tags, footers) et une sans-serif moderne (Inter/Sora) pour titres et corps.
- Gabarit : titre en grand à gauche, **kicker monospace vert en haut à droite** (`// 12 — LE PRODUIT`), footer monospace gris commençant par `>` avec la synthèse de la slide.
- **Mascotte : un cerveau vert néon 🧠** souriant, grands yeux. **PAS de hibou, PAS de logo ni monogramme** — « MINDY » s'écrit toujours en texte monospace simple.
- Ton : jeune, direct, confiant. Peu de texte, **chiffres énormes en néon**, beaucoup de noir.

## 2. Le produit (faits vérifiés — à utiliser tels quels, rien d'autre)

- **Positionnement : « Mindy — le Duolingo du business »**. App mobile française gamifiée pour monter en **compétences business au sens large** (l'argent n'est qu'une porte d'entrée). **6 domaines** : Crypto ₿ · Finance 💰 · Trading 📊 · Immobilier 🏠 · Impôts 🧾 · Entrepreneuriat 🚀 (+ section 🎬 Démo pour la soutenance).
- **Micro-leçons 5-15 min**, ~70 leçons, chacune mélangeant plusieurs des **20 mécaniques d'exercices** : quiz · vrai/faux swipe · séries de swipes · texte à trous · paires · remise en ordre · scénarios à choix · calculatrice guidée · prédiction de prix sur bougies · speed round chronométré · répartition de budget · impact d'actualité · flashcards · mots mêlés · classement drag & drop · chasse à l'arnaque · relier les points · frise chronologique · analyse visuelle de graphique · écrans info avec le coach. Une **leçon Démo « Le tour de Mindy en 20 exercices »** les enchaîne toutes. Chaque domaine se termine par un **Master Quiz** (200 XP, orderIndex de fin de parcours).
- **Gamification** : XP & niveaux · séries (streaks) + **streak freeze** (50 XP, max 3) + **rachat de série** (série perdue rachetable 48 h pour 100 XP) · combos multiplicateurs si leçons enchaînées · **quêtes du jour** (3 quêtes quotidiennes : « Termine 2 leçons », « Gagne 50 XP », « Réussis le défi du jour » — récompenses XP à réclamer) · **ligues hebdomadaires** Fer → Bronze → Argent → Or → Platine (reset chaque lundi) · ~40 **succès** en 5 catégories (Learning/Streak/XP/Social/Special) et 4 raretés (Common → Legendary) · **boutique d'avatars** : 13 avatars emoji payables en XP (100 → 2 000 XP, raretés Common → Legendary) · **défi quotidien** avec bonus XP.
- **Social & viralité** : amis (recherche, demandes) · **classement hebdo général ET entre amis** (toggle 🌍/👥) · **défis 1v1** sur une leçon (scores, revanche) · **parrainage** (code, XP des deux côtés) · **partage du résultat de leçon en image brandée** (carte dark/néon générée in-app : +XP, précision, streak, pseudo, tagline — partageable en story).
- **Onboarding 9 étapes** : accroche → niveau → domaine → objectif → temps/jour → quiz démo (crédite les premiers XP) → résultat → inscription email + mot de passe → génération du parcours personnalisé.
- **Monétisation Stripe (freemium)** : **Free 0 $** (5 leçons/jour, série basique, classement standard, défi quotidien) · **Pro 9,99 $/mois** (leçons illimitées, parcours perso IA, analytics avancées, 10 streak freezes/mois, sans pub, badge Pro) · **Pro annuel 79,99 $/an** (~−33 %, « 2 mois offerts », accès anticipé au contenu, export PDF).
- **Notifications** : push Expo + emails (rappel de série en danger, défi du jour, relance d'inactivité, milestones).
- **Back-office analytics** : DAU/WAU/MAU, rétention D1/D7/D30, funnel signup→Pro, top leçons, export CSV.
- **Stack** : monorepo **TypeScript de bout en bout** (server / mobile / types partagés) — API **NestJS** (REST + Swagger, validation **Zod** du contenu des leçons, ORM **Prisma**) · mobile **Expo / React Native** (Zustand, Reanimated) · **PostgreSQL serverless (Neon)** · **Stripe** + webhooks · **Expo Push** + emails **Resend** · auth **JWT + bcrypt**, guard global « sécurisé par défaut ». **CI/CD : un `git push` = API déployée sur Render + OTA mobile via EAS Update.** **~365 tests Jest** backend. Testable par n'importe qui via **Expo Go (QR code)**.

## 3. Règles d'honnêteté (OBLIGATOIRES)

- Mindy est en **pré-lancement/test** : AUCUN chiffre de traction réel. Tout chiffre business = **cible/hypothèse**, étiqueté « projection illustrative » ou « valeurs cibles ».
- Chiffres de marché **sourcés sur la slide** (sources fournies ci-dessous — les garder).
- Ne rien inventer d'autre. Info manquante = placeholder `[À COMPLÉTER]` visible.

## 4. Structure slide par slide (~40 slides, 4 parties)

### PARTIE 1 — INTRODUCTION (5 min · S00-S06)

**S00 — Couverture** `// 00`. « MINDY_PITCH.V2 » + « EPITECH · EDP · 2026 ». Bloc : PROMO 2028 · SESSION Juin 2026 · PRODUIT « Le Duolingo du business » · Axel · Mathis · Marius · Paul. Footer : `// 00 — couverture · 10 min/jour · en français · s'amuser en apprenant`.

**S01 — L'équipe** `// 01`. 4 cartes : **Axel** (produit & tech) · **Paul** (produit & organisation) · **Marius** (marketing & business) · **Mathis** (marketing & communication). Équipe répartie **Barcelone · Bangkok · Paris**, coordination async. `[Photos/avatars À COMPLÉTER]`.

**S02 — Pourquoi Mindy, et ce qu'on attend de l'EDP** `// 02`. Gauche : « L'EDP, c'est porter un projet entrepreneurial de bout en bout — pas un exercice technique isolé, mais un produit réel, avec un marché, un modèle et une exécution. » Droite : POUR L'ÉCOLE (démontrer idée → produit déployé : conception, technique, business, com réunis) · POUR NOUS (se confronter à un vrai problème — l'éducation financière & business — apprendre à construire, mesurer et défendre un produit) · NOTRE AMBITION (« Faire vivre Mindy au-delà de la soutenance »).

**S03 — Sommaire** `// 03`. Les 4 parties avec timing : Introduction (5') · Travail & résultats (45' : parcours, produit, technique, organisation, marketing, business, démo) · Conclusion (5') · Échanges. Chips visuelles.

**S04 — Le problème** `// 04`. « Deux vagues qui montent, zéro pont entre les deux ». 3 stats géantes avec barres : **69 %** des Français ont des connaissances financières faibles ou moyennes · **12 %** détiennent des cryptos (**+28 %/an**, surtout les moins de 35 ans) · **47 %** ratent un calcul d'intérêts simple et **80 %** veulent une éducation financière à l'école. Sources : Banque de France / OCDE (culture financière 2023-2026) · ADAN × KPMG × Ipsos 2024.

**S05 — L'insight** `// 05`. « Le modèle qui crée l'habitude existe déjà. Pas pour le business. » Gauche : « Ce n'est pas un problème d'accès à l'information. **C'est un problème de motivation et d'habitude.** Duolingo l'a prouvé sur les langues : gamification + micro-learning + mobile = rétention. Personne ne l'applique aux compétences business, en français. » Droite DUOLINGO — LA PREUVE DU MODÈLE : **50M+** utilisateurs actifs/jour · churn **47 % → 28 %** grâce aux séries et ligues · série active = **3×** plus de chances de revenir. Source : Duolingo Inc., résultats Q3 2025 (SEC).

**S06 — Le marché** `// 06`. « Un marché énorme, un croisement que personne n'occupe ». Gauche : EDTECH MONDIAL 2025 **189 Mds$ → ~589 Mds$ d'ici 2034** (mobile et gamification en tête). Droite LE WHITE SPACE (tableau) : Gamifié pur → Duolingo (langues, pas le business) · Édu crypto → Binance Academy, Coinbase Learn (articles, peu gamifiés) · Finance perso → Finary, Zogo (outils de gestion, pas un jeu quotidien) · **Mindy → seul à croiser compétences business + format Duolingo + français mobile-first**. Source : Fortune Business Insights (EdTech 2025).

### PARTIE 2 — TRAVAIL & RÉSULTATS (45 min · S07-S35)

**S07 — Transition « Notre parcours »** `// 07`. Slide de section : « 9 mois, d'une idée à un produit déployé ». 3 chiffres : ~70 leçons · ~365 tests · 1 `git push` = tout déployé.

**S08 — Timeline du projet (1/2)** `// 08`. Frise chronologique `[dates exactes À COMPLÉTER]` : 1. Conception & design system (positionnement Duolingo du business, DA dark+néon, mascotte cerveau) → 2. Socle technique (monorepo NestJS + Expo + types partagés, Postgres/Prisma, pipeline Render/EAS « git push = déploiement ») → 3. Cœur produit (moteur de leçons, progression, XP/niveaux) → 4. Gamification & rétention (séries + streak freeze, combos, ligues, succès, défi quotidien, notifs push + email) → 5. Social & croissance (amis, défis 1v1, parrainage, classement).

**S09 — Timeline du projet (2/2)** `// 09`. Suite : 6. Monétisation (Stripe 3 plans + webhooks) → 7. Analytics (back-office DAU/MAU, rétention, funnel) → 8. Refonte onboarding 9 étapes → 9. Francisation complète → 10. Sécurité (migration auth email+mot de passe, JWT/bcrypt) → 11. **Extension à 6 domaines** (Immobilier/Impôts/Entrepreneuriat + Master Quiz) → 12. **Features de viralité** (quêtes du jour, boutique d'avatars, rachat de série, classement amis, partage d'image, leçon Démo). Footer : « Chaque étape = déployée en prod le jour même. » `[Faits marquants non techniques À COMPLÉTER]`.

**S10 — La solution en une slide** `// 10`. « Mindy applique les mécaniques de jeu de Duolingo aux compétences business ». Lignes F-01 → F-05 : Micro-leçons (5-15 min/jour · interactif · jamais des pavés) · Gamification complète (XP · séries · combos · quêtes · ligues · succès · boutique) · Parcours personnalisé (niveau · domaine · objectif) · Social & compétition (classements · défis 1v1 · parrainage · partage d'image) · 6 domaines business. Footer : `> utile pour ma vie · sans m'ennuyer · je reviens chaque jour`.

**S11 — Les 6 domaines** `// 11`. Grille : ₿ Crypto (Bitcoin, blockchain, DeFi) · 💰 Finance (investir, budget, bourse) · 📊 Trading (marchés, bougies, risque) · 🏠 Immobilier (acheter, louer, investir) · 🧾 Impôts (fiscalité, déclarations) · 🚀 Entrepreneuriat (lancer & gérer un business). Chacun : ~10 leçons + 1 Master Quiz (200 XP). Footer : « L'argent n'est qu'une des portes d'entrée : Mindy = compétences business. »

**S12 — Les 20 mécaniques d'exercices** `// 12`. Grille des 20 types (liste section 2) avec mini-icônes. Message : « La variété tue l'ennui — aucune leçon ne ressemble à la précédente. » Mention de la leçon Démo « Le tour de Mindy en 20 exercices » (montrée en démo live).

**S13 — Gamification : la boucle d'habitude** `// 13`. Schéma circulaire : j'apprends (leçon → XP) → je reviens (série 🔥, quêtes du jour, défi quotidien) → je me protège (streak freeze, rachat de série 48 h/100 XP) → je me compare (ligues Fer→Platine, succès) → je dépense (boutique d'avatars 100-2 000 XP) → je ré-apprends. Footer : « Gagner → dépenser → revenir : la boucle est fermée. »

**S14 — Social & viralité intégrées** `// 14`. 4 blocs : Défis 1v1 (scores, revanche) · Classements général & amis · Parrainage (XP des deux côtés, K-factor visé ≥ 0,3) · Partage d'image de résultat (chaque story = une pub Mindy). Footer : « La croissance est dans le produit, pas seulement dans la com. »

**S15 — Onboarding personnalisé** `// 15`. Les 9 étapes en frise (accroche → niveau → domaine → objectif → temps/jour → quiz démo → résultat → inscription → parcours généré). Message : l'app s'adapte dès la première minute ; les premiers XP sont gagnés AVANT la création du compte (et crédités à l'inscription).

**S16 — Captures d'écran du produit** `// 16`. Galerie de 4-6 mockups téléphone `[captures À COMPLÉTER — sinon placeholders de cadres téléphone]` : accueil (quêtes du jour), leçon en cours, classement amis, boutique d'avatars, profil/succès.

**S17 — Production du contenu & documentation** `// 17`. Comment on fabrique une leçon : rédaction FR → **schéma de validation Zod** (20 types d'étapes, structure imposée) → tests automatiques (chaque leçon validée par la CI, une étape invalide fait échouer le build) → insertion idempotente en base au déploiement. + Documentation : API Swagger auto-générée, README/DEPLOY, types partagés comme contrat. Footer : « Le contenu est traité comme du code : versionné, validé, testé. »

**S18 — Stack technique** `// 18`. « Une architecture propre, déployée en continu ». 6 blocs : BACKEND (NestJS · REST Swagger · Zod · Prisma) · MOBILE (Expo/React Native · Zustand · Reanimated) · BASE DE DONNÉES (PostgreSQL serverless Neon) · SÉCURITÉ (JWT · bcrypt · guard global sécurisé par défaut) · PAIEMENT & NOTIFS (Stripe + webhooks · Expo Push · Resend) · DÉPLOIEMENT (Render + EAS Update · un git push déploie tout · ~365 tests Jest). Footer : « Full TypeScript de bout en bout. Monorepo : server, mobile, types partagés. »

**S19 — Architecture** `// 19`. Schéma en couches : CLIENT (Expo/RN · Zustand · Reanimated) → HTTPS/REST → API NestJS (guard JWT · validation Zod) avec modules Lessons · Gamification (+ Quests, Shop) · Social · Payments · Notifications · Analytics → Prisma ORM → DONNÉES (PostgreSQL Neon serverless, pooled). Encart SERVICES EXTERNES : Stripe + webhooks · Expo Push · Resend. Bandeau CI/CD : git push → Render (API) · EAS Update (OTA mobile).

**S20 — Qualité & sécurité** `// 20`. ~365 tests Jest backend (services, contrôleurs, contenu des leçons) · validation Zod de tout contenu entrant · auth JWT + bcrypt, endpoints privés par défaut (`@Public()` explicite) · rate limiting · soft delete des comptes · secrets hors du code. Footer : « Pas un prototype jetable : un produit qu'on peut faire grandir. »

**S21 — Organisation** `// 21`. Gauche COMMENT ON S'EST ORGANISÉ : équipe de 4 — produit (Axel, Paul), marketing (Marius, Mathis) · dev sur GitHub, tâches et commits séparés, appel hebdomadaire · coordination async, équipe répartie Barcelone · Bangkok · Paris. Droite MÉTHODE : itérations courtes, chaque feature part en prod le jour même (CI/CD), le back-office analytics comme juge de paix. `[Outils : Discord/Notion/… À COMPLÉTER]`.

**S22 — Difficultés → solutions** `// 22`. 4 blocages réels : Base de données (saturation des connexions Postgres serverless → **pooling Prisma**) · Serveur (cold starts Render + config → **pipeline ajusté + warm-up avant démo**) · Contenu (étapes au format legacy qui faisaient planter le lecteur mobile → **schéma Zod validé par tests + normalisation côté app**) · Auth (migration d'un système sans mot de passe vers JWT/bcrypt **sans casser les comptes de test**). Format : problème (blanc) → solution (vert). Footer : « Chaque solution est en prod, pas sur un slide. »

**S23 — Gestion de projet : estimé vs réel** `// 23`. Barres par chantier (jours-homme, estimé/réel) : Backend/API 40 → 52 (+30 %) · Frontend mobile 45 → 50 (+11 %) · Gamification 12 → 18 (+50 %) · Paiement Stripe 6 → 9 (+50 %) · Infra/CI-CD 5 → 8 (+60 %) · Analytics 8 → 7 (−12 %). Total **116 → 144 j (+24 %)**. Footer : « Sous-estimation concentrée sur la logique d'état et l'infra serverless. Correctif : buffer 25 % + specs détaillées sur les modules à état. »

**S24 — Transition « Marketing & business »** `// 24`. Slide de section : « Un produit ne vaut que s'il rencontre son marché. » 3 chips : Persona · Acquisition organique · Freemium.

**S25 — Business Model Canvas** `// 25`. Canvas 9 blocs rempli : Partenaires (créateurs de contenu, néobanques, écoles V2, infra Stripe/Neon/Render) · Activités clés (production de leçons, dev produit, acquisition + rétention) · Ressources clés (contenu pédago, stack + reco, marque & mascotte cerveau) · **Proposition de valeur : « Les compétences business sans s'ennuyer. 10 min/jour, format jeu, en français. Seul à croiser les trois. »** · Relations clients (self-service gamifié, notifs, communauté, coach Mindy) · Canaux (stores, TikTok/Insta/X, parrainage, SEO) · Segments (18-25 curieux crypto/business, jeunes actifs 24-32, B2B écoles V2) · Coûts (dev + infra · contenu · CAC · frais Stripe) · Revenus (Freemium 0/9,99/79,99 $ ; futur : B2B, partenariats).

**S26 — Personas** `// 26`. « Le couple persona / proposition de valeur ». P-01 PRINCIPAL **Léo, 21 ans** : étudiant, entend parler de crypto/business partout, flippe de se faire avoir, jargon intimidant, mobile-first, attention courte. P-02 **Sarah, 27 ans** : jeune active, premier vrai salaire, veut gérer budget/épargner, « la finance c'est chiant et opaque ». P-03 PRESCRIPTEUR : parent/enseignant (B2C cadeau, B2B V2), rien de ludique et fiable en FR. Footer : « Mindy répond pain par pain : micro-learning tue le temps et l'ennui · gamification tue l'inconstance · le coach tue le sentiment de nullité · contenu FR business tue l'éparpillement. »

**S27 — SWOT** `// 27`. Forces : produit déployé et complet · différenciation claire (business gamifié FR) · stack solide, ~365 tests · boucles virales intégrées. Faiblesses : pré-lancement, traction non prouvée · équipe réduite · contenu coûteux à produire · notoriété nulle. Opportunités : intérêt crypto + besoin d'éducation business · vide concurrentiel FR · partenariats fintech/écoles. Menaces : un gros acteur qui se lance · image crypto volatile, régulation · CAC mobile élevé.

**S28 — Modèle économique** `// 28`. « Freemium, trois plans branchés sur Stripe ». 3 colonnes pricing (Free 0 $ / **Pro 9,99 $ ★ POPULAIRE** / Pro annuel 79,99 $ · ~33 % d'économie · 2 mois offerts), détails section 2. Footer : `> Leviers intégrés : parrainage (XP des deux côtés) · rétention par habitude · social · partage d'image.`

**S29 — KPIs pilotés dès le premier jour** `// 29`. NORTH STAR : **≥ 20 % DAU/MAU**. 4 colonnes : ACQUISITION (CAC organique < 1 € · K-factor ≥ 0,3) · ACTIVATION (onboarding complété ≥ 75 % · 1re leçon le jour J ≥ 60 %) · RÉTENTION (J1/J7/J30 : 40/20/10 % · série médiane ≥ 7 j) · REVENU (conversion Free→Pro 2,5-3,5 % · ARPU ~100 $/an). Footer : « Cibles (pré-lancement) — tableau de bord branché sur notre module Analytics, suivi dès les premiers testeurs. »

**S30 — Le funnel** `// 30`. Entonnoir : Impressions/vues store **100 000** → install 28 % → **28 000** téléchargements → onboarding 70 % → **19 600** comptes → rétention J7 30 % → **5 880** actifs J7 → Pro ~10 % → **590 Pro**. LECTURE : **0,6 %** d'impression à abonné Pro. Deux points de fuite prioritaires : l'install (ASO) et la rétention J7 (séries, quêtes, notifs). Footer : « Cohorte type ramenée à 100 000 impressions. Valeurs cibles illustratives, pré-lancement. »

**S31 — Business plan 3 ans** `// 31`. Bar chart téléchargements **30k / 180k / 600k**. HYPOTHÈSES : conversion Pro **2,5 → 3,5 %** · abonnés Pro **~300 / 1 800 / 6 000** · ARPU mixte **~100 $/an** → revenus ~**30k / 180k / 600k $** · coûts principaux : contenu + acquisition + infra (infra quasi nulle au départ : ~0-50 €/mois) · **point mort visé courant année 2**. Footer : « Projection illustrative. Hypothèses à valider. Mindy est en pré-lancement. »

**S32 — Roadmap 3 ans** `// 32`. Gantt 4 pistes (PRODUIT/MARKETING/COMMERCE/TECH) × 4 périodes : T1 Lancement 0-6 mois (Catalogue · Teasing puis Créateurs · Hardening) · T2 Traction 6-12 mois (Reco IA · Conversion Pro · Scalabilité) · T3 Croissance An 2 (Intl EN · SEO contenu + Paid ciblé · Partenariats) · T4 Échelle An 3 (Marketplace · B2B écoles · Observabilité). Marqueur vertical « RECO IA → MARKETING » (la v2 Reco IA déclenche la vague créateurs). Footer : « Chaque jalon produit alimente une action marketing puis commerciale. Trois pistes synchronisées, pas en silos. »

**S33 — Stratégie marketing : 3 phases** `// 33`. Gauche LES 3 PHASES : P0 Pré-lancement (waitlist, teasing TikTok, 1ers créateurs, beta-testeurs) · P1 Lancement (ASO stores, vague de créateurs finance/business, PR étudiante) · P2 Croissance (moteur de parrainage, SEO de contenu, test paid ciblé). Droite tableau CANAL / RÔLE / KPI : TikTok-Reels (notoriété, top funnel · complétion) · ASO stores (conversion install · taux d'install) · Parrainage in-app (viralité · K-factor) · SEO/contenu (long terme · trafic) · Créateurs finance (crédibilité, reach · CPM). Bas : 3 PILIERS DE CONTENU — vulgariser la crypto & déjouer les arnaques · compétences business actionnables, 1 geste par vidéo · coulisses produit & communauté, build in public.

**S34 — Communication : les posts** `// 34`. « Acquisition organique, contenu natif par réseau ». 3 colonnes d'accroches : TIKTOK « Tu scrolles 2h sur la crypto mais t'as toujours rien compris. 5 min sur Mindy et t'as les bases. » · INSTAGRAM « 3 erreurs de débutant en crypto, et comment Mindy te les évite. » (carrousel · CTA commence gratuitement) · X « On construit le Duolingo du business. Crypto, finance, immobilier, impôts, entrepreneuriat — 10 min/jour, en français. » Footer : « Boucle : contenu natif → parrainage → rétention. Ton coach, dark + néon, parallèle Duolingo assumé. »

**S35 — Les visuels de campagne** `// 35`. **INTÈGRE ICI LES 6 VISUELS FOURNIS EN PIÈCES JOINTES** en galerie (héro « LE DUOLINGO DU BUSINESS », hook TikTok, « GARDE TA SÉRIE », carrousel « 3 ERREURS », « DÉFIE TES POTES », story « 10 min par jour ») + calendrier de publication J-14 → J-2 et mesure : vues, partages, clics, **inscriptions bêta traquées dans notre propre back-office analytics**. `[Résultats réels des posts À COMPLÉTER — sinon présenter comme plan de com prêt à exécuter]`.

### DÉMO (dans les 45 min · S36-S37)

**S36 — Trame de démo** `// 36`. 01 Login dark/néon, nouvel utilisateur · 02 Onboarding 9 étapes (quiz démo qui crédite les premiers XP) · 03 Arrivée sur l'accueil : parcours généré + quêtes du jour · 04 **Leçon Démo « Le tour de Mindy en 20 exercices »** — XP, succès, confetti, série · 05 **Partage du résultat en image** (story brandée) · 06 **Boutique d'avatars** (dépenser ses XP) · 07 Classement toggle **Général/Amis** + lancer un **défi 1v1** · 08 Aperçu Pro + back-office analytics (rétention, funnel). Footer : « Fil rouge : rapidité, fun, boucle d'habitude, dimension sociale. »

**S37 — Plan B & QR** `// 37`. Double usage : grille de captures d'écran de secours `[À COMPLÉTER]` si le réseau lâche + **QR code géant « Testez pendant qu'on parle — Expo Go »** `[QR À COMPLÉTER]`. Rappel warm-up API avant la démo.

### PARTIE 3 — CONCLUSION (5 min · S38-S40)

**S38 — Bilan vs objectifs** `// 38`. PRÉVU VS RÉALISÉ : objectifs produit atteints — onboarding, gamification, social, paiements, analytics, 6 domaines, quêtes, boutique, rachat de série, partage — **tout est construit et déployé** · à étendre : davantage de contenu de leçons · phase actuelle : pré-lancement/test, pas encore d'utilisateurs payants (impact : le business plan reste des hypothèses — assumé et mesurable dès les premiers testeurs).

**S39 — La suite** `// 39`. 01 Mise en ligne stores + premiers testeurs réels · 02 Lancer la boucle d'acquisition organique (TikTok, parrainage) · 03 Mesurer rétention et conversion dans notre back-office, itérer sur le contenu · 04 An 2-3 : Reco IA, international, B2B écoles. Ligne d'ambition : « Faire vivre Mindy au-delà de la soutenance. »

**S40 — Merci** `// FIN`. « Merci. » géant avec point vert néon. Footer : « MINDY · LE DUOLINGO DU BUSINESS — Axel · Mathis · Marius · Paul » + QR de test `[À COMPLÉTER]`. Cette slide reste affichée pendant les échanges : ajoute discrètement 4-5 chiffres clés de rappel (189 Mds$ · 69 % · ≥20 % DAU/MAU · 0,6 % funnel · point mort an 2) pour aider pendant les questions.

## 5. Contraintes de sortie

- **~40 slides**, notes de présentation sous CHACUNE : orateur suggéré (répartition indicative — Axel : produit/tech/démo · Paul : produit/organisation/gestion de projet · Marius : marché/business/BMC/BP · Mathis : marketing/communication/personas — mais chacun doit pouvoir tout défendre), message clé en 1 phrase, timing 60-120 s.
- Chaque chiffre garde sa source à l'écran ; tout chiffre prospectif porte « cible » ou « projection ».
- Slides de transition (S07, S24) très épurées : 1 phrase + 3 chips.
- Si HTML : navigation clavier ←/→, plein écran, une slide = un écran 16:9, zéro dépendance réseau (styles inline, visuels embarqués en data URI), compteur de slides discret.
