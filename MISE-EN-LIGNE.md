# Mettre le nouveau site de Regline en ligne (5 minutes)

Le site sera à l'adresse **https://regline.ch** (l'ancienne adresse https://leandro526-c.github.io/regline/ y redirigera toute seule).
Il est 100 % statique (HTML, CSS, JavaScript, vidéos MP4, images WebP) : GitHub Pages le sert tel quel,
sans réglage ni étape de compilation.

## Ce que contient le dossier

| Fichier ou dossier | Rôle |
|---|---|
| `index.html` | la page |
| `confidentialite.html` | la politique de confidentialité (https://regline.ch/confidentialite.html, pour l'app et le Microsoft Store) |
| `site.js` | boutons de téléchargement, langue, animations |
| `langues.js` | tous les textes en anglais, allemand, italien et espagnol |
| `polices.css`, `polices/` | les polices, hébergées sur le site (aucune requête vers Google) |
| `logo.png` | l'icône |
| `CNAME` | dit à GitHub que le site s'appelle regline.ch (ne pas le supprimer) |
| `sitemap.xml` | la liste des pages, pour Google |
| `media/fr`, `media/en`, `media/de`, `media/it`, `media/es` | vidéos et captures de la vraie app, une version par langue |

`MISE-EN-LIGNE.md` (ce fichier) n'a pas besoin d'être déposé.

## 1. Remplacer l'ancien site

1. Ouvre le dépôt public : https://github.com/Leandro526-c/regline
2. Supprime l'ancienne capture : clique sur `capture.png` → icône ⋯ → **Delete file** → **Commit changes**.
3. Va sur **Add file → Upload files** : https://github.com/Leandro526-c/regline/upload/main
4. Depuis l'Explorateur Windows, **glisse en une fois** le contenu du dossier `site` : les fichiers
   `index.html`, `confidentialite.html`, `site.js`, `langues.js`, `polices.css`, `logo.png`, `CNAME`, `sitemap.xml` **et** les dossiers `polices` et `media`.
   GitHub garde les sous-dossiers quand on glisse des dossiers (Chrome, Edge ou Firefox).
5. Vérifie dans la liste que tu vois bien des chemins comme `media/fr/demo-coller.mp4` et
   `polices/IBMPlexSans-normal-400-latin.woff2`, puis clique sur **Commit changes**.

Après une ou deux minutes, le nouveau site est en ligne. Si l'ancien s'affiche encore, recharge avec Ctrl+F5.

## 2. Brancher regline.ch (une seule fois)

**a) Chez Infomaniak** (Manager → Domaines → regline.ch → **Zone DNS**) :

1. Supprime les enregistrements **A**, **AAAA** et **CNAME** déjà présents pour `regline.ch` et `www`
   (ceux qu'Infomaniak met par défaut vers sa page de parking). Ne touche pas aux MX/TXT s'il y en a.
2. Ajoute 4 enregistrements **A**, source vide (ou `@`), un par adresse :
   `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
3. Ajoute 4 enregistrements **AAAA**, source vide (ou `@`) :
   `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`
4. Ajoute 1 enregistrement **CNAME** : source `www`, cible `leandro526-c.github.io`

**b) Sur GitHub** : https://github.com/Leandro526-c/regline/settings/pages

1. Dans **Custom domain**, tape `regline.ch` puis **Save** (si le fichier `CNAME` est déjà déposé, c'est déjà rempli).
2. Attends que la vérification DNS passe au vert (de quelques minutes à quelques heures).
3. Coche **Enforce HTTPS** dès que la case n'est plus grisée (GitHub fournit le certificat gratuitement,
   ça peut prendre jusqu'à 24 h).

Conseillé, pour que personne d'autre ne puisse réclamer ton domaine sur GitHub :
https://github.com/settings/pages → **Add a domain** → `regline.ch`. GitHub te donne un enregistrement **TXT**
à ajouter dans la Zone DNS d'Infomaniak, puis tu cliques **Verify**.

## 3. Vérifier

- Sur ton PC : le grand bouton doit dire « Télécharger pour Windows ».
- Ajoute `?lang=de` à l'adresse pour voir le site en allemand (idem `en`, `it`, `es`, `fr`).
  Sans ce paramètre, la langue suit celle du navigateur ; le choix dans le menu est mémorisé.
- Les vidéos démarrent seules, sans son, et se mettent en pause quand on ne les voit plus.

## 4. Pour chaque nouvelle version

Rien à changer sur le site : il lit la dernière release du dépôt et affiche son numéro, sa date et le lien
« Nouveautés ». Les fichiers doivent toujours finir par `-Windows-Setup.exe`, `-Darwin-arm64.dmg`,
`-Darwin-x86_64.dmg` et `-Linux-x86_64.tar.gz`.

S'il manque un fichier (par exemple la version Mac Apple Silicon), le site l'indique clairement
(« pas encore prête pour cette version ») au lieu d'envoyer vers une page sans explication.

Sur un Mac, le site devine si la puce est Apple Silicon ou Intel et met la bonne version en premier ;
quand il ne peut pas le savoir, il propose les deux.

## Aperçu sur ton PC

Les vidéos ne se lancent pas toujours en double-cliquant `index.html` (sécurité du navigateur).
Pour un aperçu fidèle : dans le dossier `site`, ouvre PowerShell et tape `python -m http.server 8000`,
puis va sur http://localhost:8000.

## Textes à faire relire

Les textes allemand, italien et espagnol (`langues.js`) ont été écrits avec soin, mais une relecture par
une personne de langue maternelle reste conseillée, comme pour l'app.

## Apparaître sur Google quand on tape « Regline »

1. Va sur https://search.google.com/search-console (avec ton compte Google) → **Ajouter une propriété** →
   **Domaine** → `regline.ch` (Google te donne un enregistrement TXT à ajouter dans la Zone DNS d'Infomaniak, puis **Valider** ; ça couvre aussi www et http).
2. Fais-le seulement une fois que https://regline.ch affiche bien le nouveau site.
3. Dans le menu **Sitemaps**, ajoute `sitemap.xml` et envoie.
4. Dans **Inspection de l'URL**, colle l'adresse du site et clique **Demander une indexation**.

Ensuite, Google met en général quelques jours à deux semaines pour afficher le site. Pour remonter en tête,
le plus efficace est que d'autres pages pointent vers le site : le lien Ko-fi, le README du dépôt GitHub,
les messages aux camarades et aux assistants des TP, les forums ou groupes d'étudiants.
Pour Bing (et donc DuckDuckGo) : https://www.bing.com/webmasters permet d'importer directement depuis Search Console.
