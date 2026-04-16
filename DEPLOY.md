# Mindy — Setup déploiement (Neon + Render + EAS Update)

Une fois ces étapes faites, **chaque `git push` sur `main`** déclenchera :
1. Render redéploie l'API NestJS
2. GitHub Actions publie une mise à jour OTA → testeurs voient les changements en relançant Expo Go

---

## 1️⃣ Postgres sur Neon (3 min)

1. Va sur https://neon.tech → "Sign up with GitHub"
2. Crée un projet (région : Frankfurt ou Paris)
3. Dans **Dashboard → Connection string**, copie l'URL pooled qui ressemble à :
   ```
   postgresql://user:pass@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```
4. **Garde-la sous le coude** — on en a besoin à l'étape 2.

---

## 2️⃣ Backend sur Render (5 min)

1. Va sur https://render.com → "Sign up with GitHub"
2. Dashboard → **New** → **Blueprint**
3. Connecte le repo `Axelmi1/Mindy` → Render détecte `render.yaml`
4. Render te demandera de remplir la variable secrète **`DATABASE_URL`** :
   - Colle l'URL Neon de l'étape 1
5. Clique **Apply** → premier déploiement lance (~5 min)
6. Quand c'est vert, copie l'URL publique : `https://mindy-api.onrender.com` (le nom peut varier)

⚠️ Le plan free Render s'endort après 15 min d'inactivité (cold-start ~50s au réveil). Acceptable pour démo.

---

## 3️⃣ Mobile : init EAS une seule fois (5 min)

```bash
cd mobile
npm install -g eas-cli
eas login                    # crée un compte Expo gratuit si besoin
eas init                     # ⚠️ ça remplit automatiquement le projectId dans app.json
eas update:configure         # configure le canal d'update
```

Après `eas init`, ouvre `mobile/app.json` et **vérifie** que `updates.url` ne contient plus `REPLACE_WITH_PROJECT_ID_AFTER_EAS_INIT` (eas init le remplace tout seul). Si pas, copie le projectId depuis `extra.eas.projectId` et remplace manuellement.

Premier publish manuel (sert à créer la branche `preview`) :
```bash
EXPO_PUBLIC_API_URL=https://mindy-api.onrender.com/api eas update --branch preview --message "initial"
```

→ EAS te donne un **lien** (ex: `https://expo.dev/preview/update?...`) et un **QR code**.

---

## 4️⃣ Auto-deploy mobile via GitHub Actions (3 min)

Pour que chaque `git push` publie une mise à jour OTA :

1. Génère un token Expo : https://expo.dev/accounts/[ton-compte]/settings/access-tokens → **Create token** → copie-le
2. Va dans le repo GitHub : `Axelmi1/Mindy` → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**
3. Crée 2 secrets :
   - `EXPO_TOKEN` = le token Expo
   - `EXPO_PUBLIC_API_URL` = `https://mindy-api.onrender.com/api`
4. Done ✅ — `.github/workflows/eas-update.yml` est déjà en place.

---

## 5️⃣ Partage l'app aux testeurs

Donne-leur :
- 📱 Installer **Expo Go** (App Store / Play Store)
- 🔗 Ouvrir le lien : `https://expo.dev/preview/update?...` (depuis l'étape 3)
  - Ou scanner le QR code que `eas update` t'a donné
- L'app se télécharge dans Expo Go et tourne sur leur tél, depuis n'importe où dans le monde 🌍

---

## ⚡ Workflow quotidien après ce setup

```bash
# Tu codes...
git add .
git commit -m "fix: lesson XP bug"
git push
```

→ ~30s : GitHub Action push une mise à jour OTA  
→ ~5min : Render redéploie l'API si tu as touché `server/`  
→ Testeurs voient les changements en quittant + rouvrant Expo Go

---

## 🩺 Commandes de debug

```bash
# Voir les builds Render
open https://dashboard.render.com

# Voir les updates EAS publiés
cd mobile && eas update:list --branch preview

# Tester l'API locale
curl https://mindy-api.onrender.com/api/docs
```
