# L'Argent Expliqué — Calculateurs de finances personnelles

Site statique de 5 calculateurs financiers en français, mobile-first, sans dépendance externe.
Conçu comme tunnel SEO → chaîne YouTube [@tonargentexplique](https://www.youtube.com/@tonargentexplique).

## Calculateurs inclus

| Fichier | Calculateur | Mots-clés cibles |
|---|---|---|
| `interets-composes.html` | Intérêts composés avec graphique | "calculateur intérêts composés", "simulateur épargne" |
| `regle-72.html` | Règle des 72 | "règle des 72", "doubler son capital" |
| `epargne-mensuelle.html` | Épargne mensuelle | "calculateur épargne mensuelle", "simulateur versements" |
| `inflation-pouvoir-achat.html` | Inflation & pouvoir d'achat | "calculateur inflation", "pouvoir d'achat" |
| `livret-a-vs-inflation.html` | Livret A vs Inflation | "livret a inflation", "rendement réel livret a" |

## Déployer sur GitHub Pages (2 étapes)

1. **Créer un dépôt GitHub** : va sur github.com → New repository → nommer `largent-calculateurs` (public).
2. **Pusher les fichiers** :
   ```bash
   cd "G:\Mon Drive\BOS\Output\Apps\largent-calculateurs"
   git init
   git add .
   git commit -m "Initial deploy — L'Argent Expliqué calculateurs"
   git remote add origin https://github.com/TON_USERNAME/largent-calculateurs.git
   git push -u origin main
   ```
3. **Activer GitHub Pages** : Settings → Pages → Source = `main` branch → `/` (root) → Save.
4. Le site est live sur `https://TON_USERNAME.github.io/largent-calculateurs/` en ~2 minutes.
5. **Domaine custom (optionnel)** : si tu as `tonargentexplique.fr`, ajoute un CNAME dans DNS pointant vers `TON_USERNAME.github.io`, puis configure le Custom domain dans les Settings Pages.

Mettre à jour le sitemap.xml avec l'URL finale avant de pusher.

## Architecture des fichiers

```
largent-calculateurs/
├── index.html                    # Hub — liste des 5 calculateurs
├── interets-composes.html
├── regle-72.html
├── epargne-mensuelle.html
├── inflation-pouvoir-achat.html
├── livret-a-vs-inflation.html
├── assets/
│   ├── style.css                 # CSS partagé (thème sombre vert-nuit)
│   └── app.js                    # JS partagé (formules + canvas charts)
├── sitemap.xml
├── robots.txt
└── README.md
```

**Zéro dépendance externe** : pas de CDN, pas de framework, pas de Google Fonts.
Fonctionne en ouvrant `index.html` directement dans le navigateur (file://).

## Pistes de monétisation (à activer quand le trafic arrive)

### 1. Google AdSense (passif, simple)
Des emplacements commentés `<!-- AD_SLOT: ... -->` sont déjà présents dans chaque page.
Pour activer :
- Créer un compte AdSense sur ads.google.com
- Coller le code de vérification dans le `<head>` de chaque page
- Remplacer les commentaires `<!-- AD_SLOT -->` par les balises `<ins class="adsbygoogle">`
- Attendre la validation AdSense (généralement 1-4 semaines après ~1 000 visiteurs/mois)
- RPM estimé en finance personnelle FR : 3–8 €/1 000 pages vues (YMYL = fort RPM)

### 2. Affiliation banques et courtiers français (revenu par clic/lead)
Intégrer des liens d'affiliation discrets dans le contenu éducatif, avec **disclaimer obligatoire** :
- **Boursorama** : programme affiliation direct (parrainage + commission)
- **Fortuneo** : ~80 € par ouverture de compte validé
- **Trade Republic** : programme d'affiliation (compte-titres, PEA)
- **Linxea** (assurance-vie) : commissions sur ouverture
- **Réseau Awin/Effiliation** : agrège plusieurs courtiers FR
- Format recommandé : "Pour mettre en pratique ce calcul, ces plateformes proposent des PEA/comptes-titres [lien affilié — commission perçue si ouverture]."
- Toujours mentionner le lien commercial (RGPD + déontologie YMYL)

### 3. Produit numérique premium (marge maximale)
Créer un "Pack Calculateurs Avancés" ou un guide PDF :
- Guide PDF "Construire son patrimoine en France" (15–29 €)
- Tableau Excel/Google Sheets avancé avec toutes les simulations
- Mini-formation "Comprendre son argent" (bundle avec la chaîne YouTube)
- Vente via Gumroad (0% frais sur premiers 10k€) ou Lemon Squeezy
- CTA à ajouter dans chaque calculateur : "Télécharger le guide complet →"

## SEO — checklist avant lancement

- [ ] Mettre à jour les URLs dans `sitemap.xml` avec le domaine réel
- [ ] Mettre à jour les `<link rel="canonical">` et `og:url` dans chaque HTML
- [ ] Soumettre le sitemap dans Google Search Console
- [ ] Ajouter Google Analytics (tag GA4 dans le `<head>`) si suivi trafic voulu
- [ ] Tester chaque page sur PageSpeed Insights (cible : 90+ mobile)
- [ ] Vérifier les balises Open Graph avec le validateur Facebook/LinkedIn

## Vérification des formules

### Exemple 1 — Intérêts composés
1 000 € à 5 %/an sur 30 ans, sans versement mensuel :
```
i = (1.05)^(1/12) - 1 = 0.004074
FV = 1000 × (1.004074)^360 = 4321.94 €
```
Vérification directe : 1000 × 1.05^30 = 1000 × 4.32194 = **4 321,94 €** ✅

### Exemple 2 — Inflation
1 000 € à 2 %/an d'inflation sur 30 ans :
```
Valeur réelle = 1000 / (1.02)^30 = 1000 / 1.81136 = 551.97 €
```
Perte de pouvoir d'achat : 44,8 % ✅
