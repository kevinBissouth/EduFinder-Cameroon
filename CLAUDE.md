# CLAUDE.md — EduFinder Cameroon

Guide de travail pour toute personne (humaine ou agent IA) intervenant sur ce projet.
À lire intégralement avant chaque tâche, quelle que soit sa taille.

---

## 1. Le projet en une page

EduFinder Cameroon est une plateforme web publique qui permet aux parents, élèves,
étudiants et visiteurs de **rechercher et comparer des établissements scolaires et
universitaires au Cameroun** : frais par classe/filière, tranches de paiement, résultats
aux examens, services, contacts, localisation, galerie.

Trois rôles :
- **Visiteur public** : consulte et recherche sans compte.
- **Administrateur d'établissement** : gère UNIQUEMENT les établissements qui lui sont
  confiés et soumet ses modifications pour validation.
- **Super administrateur** : valide/refuse/suspend les publications, gère les catégories
  et les comptes.

Principe fondamental (issu du cahier des besoins) : la plateforme n'affirme jamais qu'un
établissement est « le meilleur » — elle aide chaque utilisateur à trouver celui qui
correspond à SES critères.

## 2. Architecture et stack technique

```
EduFinder-Cameroon/
├── backend_django/           # API Django REST Framework
│   ├── manage.py
│   ├── config/               # Projet : settings (lecture .env), urls (/health, /media
│   │                         #   servi seulement si DEBUG), vue de santé
│   ├── edufinder/            # L'application
│   │   ├── models/           # Modèles : reference, establishment, user, submission,
│   │   │                     #   notification, enums (tous exportés dans __init__)
│   │   ├── migrations/       # Migrations Django (head : 0006_university_type_without_sector)
│   │   ├── serializers/      # Sérialiseurs DRF : entrées validées et sorties exposées
│   │   ├── services/         # Logique métier : recherche, propositions, validation,
│   │   │                     #   suspension, notifications, activité, médias, sécurité
│   │   ├── views/            # Une vue par espace : public, auth, manager,
│   │   │                     #   manager_media, admin, notifications, activity
│   │   │                     #   (access.py regroupe les contrôles d'accès)
│   │   ├── urls.py           # Toutes les routes de l'API
│   │   ├── authentication.py # Jeton JWT lu dans le cookie httpOnly
│   │   ├── permissions.py    # Rôles : responsable ou super admin, super admin seul
│   │   ├── middleware.py     # Contrôle de l'en-tête Origin (protection CSRF)
│   │   ├── throttling.py     # Limite des tentatives de connexion
│   │   └── management/commands/  # set_account_password
│   ├── tests/                # Tests pytest de l'API publique, responsable et admin
│   │                         #   (SQLite en mémoire, la base MySQL de démo n'est jamais touchée)
│   ├── requirements.txt      # Dépendances backend épinglées
│   └── .env                  # Secrets — JAMAIS commité
├── frontend/                 # React + Vite
│   └── src/
│       ├── pages/            # HomePage (recherche), SchoolProfilePage (fiche), LoginPage,
│       │                     #   ManagerHomePage, AdminHomePage
│       ├── components/       # ui/ = briques de base ; school-profile/ = fiche publique ;
│       │                     #   workspace/ = commun aux espaces privés ; charts/ =
│       │                     #   graphiques ; manager/ et admin/ = espaces privés
│       ├── hooks/            # État et appels API (useInstitutions, useNotifications…)
│       ├── utils/            # auth.js (appels authentifiés par cookie httpOnly),
│       │                     #   format, media, tracking…
│       ├── i18n/             # Choix de langue : configuration, langues proposées,
│       │                     #   locales/<langue>/<espace>.json (les textes de l'interface)
│       ├── index.css         # Jetons du design : couleurs, rayons, ombres, polices
│       └── routes.js         # Routage minimal par hash (#/school/:id, #/login,
│                             #   #/manager, #/school-admin), sans dépendance
├── media/                    # Fichiers téléversés et images de démo, servis sur /media
└── docs/                     # Documents du sujet
```

- **Backend** : Python 3.12, Django 5.2, Django REST Framework, MySQL.
- **Frontend** : React 19, Vite, Tailwind CSS 4, Recharts (graphiques), Leaflet (carte),
  axios (le seul client HTTP).
- **Base** : MySQL `edufinder_db` ; `DATABASE_URL` dans `backend_django/.env`
  (ne jamais afficher ni modifier ce fichier, ne jamais le committer).
- Le schéma a d'abord été créé par Alembic (ancien backend FastAPI, supprimé) : la
  migration `0001_initial` le reprend tel quel et a été appliquée avec `--fake-initial`
  sur la base de démo.


Règle d'or API publique : **seuls les établissements `published` sont visibles**
(pending, rejected, suspended, draft = invisibles).

## 3. Conventions de code

### Langues
- **Tout le code est en anglais** : identifiants, fonctions, messages API, routes,
  noms de fichiers.
- **L'interface est bilingue, anglais et français** : aucun texte visible n'est écrit
  en dur dans un composant. Il passe par `t('…')` et existe dans les deux fichiers
  `frontend/src/i18n/locales/en/` et `fr/` ; `npm run check:i18n` vérifie que les deux
  langues ont les mêmes clés. Les montants, taux et dates passent par `utils/format.js`.
- **Les listes de référence sont bilingues en base** (types, régions, secteurs,
  sections, cycles, filières, examens, modalités de paiement) : colonnes `label_fr` et
  `label_en`, exposées par `GET /reference-labels`. La colonne d'origine (`name` ou
  `label`) reste la clé métier et ne se traduit jamais sur place.
- **Les textes saisis par un établissement** (description, biographie, services)
  restent pour l'instant dans la langue où ils ont été écrits. Les noms propres (villes,
  établissements, classes comme « 6e » ou « Form 1 ») ne se traduisent pas.
- **Les commentaires sont en français**, à la première personne du singulier, comme si
  le développeur les écrivait pour lui-même.

### Commentaires (règle stricte)
- Uniquement sur les **parties importantes ou non évidentes** : logique métier délicate,
  choix de conception, pièges, contraintes de sécurité, migrations manuelles.
- **Jamais** de commentaire trivial (« incrémente i »), jamais de commentaire sur du
  code évident, jamais de commentaires générés en masse.
- Style : notes personnelles naturelles. **Interdit** : « on aurait pu… », « je te
  montre… », « nous allons… », « ce code fait… » (redondant avec le code).
- Exemple accepté :
  ```python
  # Ici je garde l'historique complet des anciens frais : la règle 4 du cahier des
  # besoins impose de conserver les montants passés tout en identifiant clairement
  # l'année en cours, donc je ne supprime jamais une ligne school_fee.
  ```

### Nommage explicite (règle stricte)
- Chaque variable, fonction, classe, paramètre porte un nom qui décrit son rôle :
  lire le nom doit suffire à deviner ce que contient ou fait la chose.
- Interdit : abréviations ambiguës (`est`, `pm`, `qry`), monogrammes, noms génériques
  (`query`, `data`, `tmp`) dès qu'un nom précis existe. Exemple : `est` →
  `establishment`, `pm` → `payment_method`, `query` → `select_stmt`.
- Tolérance : `i`/`j` pour les index de boucle triviale ; la boucle `for x in ...`
  où `x` est le nom complet du type de l'élément.
- Les noms de colonnes SQL suivent le modèle (`id_fee`, `label`…) : on ne les
  renomme jamais sans migration ; les noms explicites s'appliquent au code Python.

### Principes de qualité du code
Règles à respecter dans TOUTE construction de notre projet :
- **KISS** : la solution la plus simple qui fonctionne ; pas de couche, de
  classe ou de dépendance superflue (ex. : pas de service pour un simple
  SELECT).
- **DRY** : pas de duplication ; une logique partagée existe en un seul
  endroit (filtres, mappings, vérifications) et est réutilisée.
- **YAGNI** : pas de code pour un besoin hypothétique ; on construit ce qui
  est demandé, quand c'est demandé.
- **SOLID**, appliqué avec bon sens :
  - *S* : une classe/une fonction = un seul rôle (vues = exposer, sérialiseurs =
    formater, services = métier) ;
  - *O* : ouvert à l'extension, fermé à la modification (ajouter un filtre
    sans réécrire la fonction) ;
  - *D* : dépendre des abstractions (services, QuerySet), jamais d'un détail
    d'implémentation.
- **Lisibilité** : fonctions courtes (une seule chose par fonction), code qui
  se lit comme une phrase, commentaires pour le *pourquoi* jamais pour le
  *quoi*.
- **Robustesse** : échouer tôt et clairement (404/422 explicites), valider
  toute entrée, n'exposer que le périmètre nécessaire (sérialiseur de sortie),
  supprimer le code mort.
- **Structure (9 règles anti-flèche)** : sortir tôt au lieu d'empiler les
  `else` (`if condition: return/raise`, jamais `else` quand un return tôt
  existe) ; un seul niveau d'indentation par fonction (des `if` imbriqués =
  à extraire) ; pas de `switch` (dictionnaire de correspondance ou
  polymorphisme) ; pas de conditions inutiles (`if x: return True else:
  return False` → `return x`) ; fonctions courtes (une seule responsabilité,
  ~10 lignes max) ; peu de paramètres (au-delà de 3-4, regrouper dans un
  objet). Ces règles s'arbitrent : un `else` est acceptable si le `return`
  tôt est moins lisible.
- **Règle d'or** : le code est écrit une fois mais lu cent fois — toute
  construction doit être compréhensible sans effort par son auteur dans
  6 mois.

## 4. Démarche professionnelle — à suivre pour CHAQUE tâche

Le travail se fait dans l'ordre, sans sauter d'étape :

1. **Comprendre la demande** : reformuler ce qui est demandé, lever les ambiguïtés
   AVANT d'écrire du code. En cas de doute : poser la question.
2. **Explorer l'existant** : lire les fichiers concernés, vérifier les modèles, l'état
   des migrations (`python manage.py showmigrations`), l'état git, les données en base. Ne jamais
   réécrire ce qui existe déjà.
3. **Plan + alternatives + justification** : présenter le plan d'action, les approches
   possibles, puis **expliquer pourquoi la solution retenue** a été choisie (simplicité,
   cohérence avec l'existant, sécurité, maintenabilité). Cette explication fait partie
   du livrable.
4. **Implémenter** : code propre, conventions respectées, pas de code mort, pas de
   dépendance ajoutée sans justification.
5. **Vérification absolue** (voir section 6) : ne jamais annoncer « c'est fait » sans
   avoir testé.
6. **Récapitulatif** : résumer ce qui a été fait, les tests passés, les choix retenus
   et ce qui reste à faire.

## 5. Sécurité — priorité absolue

La plateforme expose des données publiques mais protège des espaces privés. Chaque
fonctionnalité doit être pensée sécurité d'abord :

1. **Secrets** : jamais de secret dans le code ni dans les messages ; `.env` jamais
   commité, jamais affiché, jamais loggé.
2. **Mots de passe** : hachés avec bcrypt uniquement (jamais en clair, jamais loggés,
   jamais renvoyés par l'API). Rappel : passlib 1.7.4 est incompatible avec bcrypt 5+
   — utiliser bcrypt directement.
3. **Authentification** : JWT signé avec secret d'environnement, posé dans un cookie
   httpOnly (jamais lisible en JavaScript) ; durée de vie courte ; déconnexion par
   expiration du cookie côté serveur (`/auth/logout`).
4. **Autorisations (règle du cahier des besoins)** : un administrateur ne peut
   consulter/modifier QUE les établissements associés dans `user_establishment` —
   vérifier cette appartenance sur chaque requête privée, côté serveur, jamais côté
   client. Refus clair (403) sinon.
5. **Validation des entrées** : tout ce qui entre par l'API passe par des sérialiseurs
   DRF ; aucun SQL construit par concaténation côté API ; paramétrer les requêtes
   (requêtes SQL brutes réservées aux scripts de données hors API).
6. **CORS** : en production, `cors_origins` = liste blanche explicite du domaine du
   site, jamais `*` avec les cookies.
7. **Visibilité publique** : les données non validées ou suspendues ne doivent JAMAIS
   sortir des endpoints publics ; les coordonnées privées des administrateurs ne sont
   jamais publiques.
8. **Workflow de validation** : toute modification importante passe par
   brouillon → soumission → validation → publication ; l'API publique ne voit que
   l'état publié.
9. **Actions destructives** : confirmation obligatoire côté UI ; suppression logique
   privilégiée (historique conservé).
10. **Fichiers** : téléversement limité en types et en taille, noms de fichiers
    générés côté serveur, jamais d'exécutable.
11. **Journalisation** : actions importantes (validations, refus, suspensions)
    enregistrées sans données sensibles.

### Contrôle sécurité continu (à chaque tâche, quelle que soit sa taille)
Avant de déclarer une tâche terminée, répondre explicitement à ces trois questions :
1. **Secrets** : cette modification expose-t-elle un secret (`.env`, mot de passe,
   token) dans le code, un log ou une réponse API ?
2. **Visibilité** : cette modification peut-elle faire sortir une donnée non publiée
   ou suspendue d'un endpoint public, ou des coordonnées privées d'un administrateur ?
3. **Autorisations** : toute route privée vérifie-t-elle l'appartenance
   `user_establishment` côté serveur (403 sinon) — jamais côté client ?
Toute réponse « oui » à une question de fuite bloque la fin de la tâche.

## 6. Vérification absolue

Aucune tâche n'est terminée sans vérification réelle. Commandes de référence
(à adapter au contexte) :

```bash
# Backend — lancer depuis le dossier backend_django/
cd backend_django && python manage.py runserver 8000

# Backend — migrations
cd backend_django && python manage.py showmigrations   # état réel
cd backend_django && python manage.py migrate          # appliquer

# Backend — tests (SQLite en mémoire)
cd backend_django && python -m pytest

# Backend — tests manuels des endpoints
curl -s http://127.0.0.1:8000/health
curl -s "http://127.0.0.1:8000/institutions?city_id=19&type_id=30"
curl -s http://127.0.0.1:8000/institutions/999   # attendu : 404

# Frontend
cd frontend && npm run lint
cd frontend && npm run check:i18n     # mêmes clés en anglais et en français
cd frontend && npm run build
```

À vérifier systématiquement :
- **Backend** : chaque endpoint en succès ET en échec (404, 422 sur entrée invalide,
  filtres sans résultat, combinaisons de filtres) ; l'API ne renvoie jamais un
  établissement non publié.
- **Frontend** : les 4 états de l'interface (chargement, données, aucun résultat,
  erreur) ; filtres qui envoient de vraies requêtes ; responsive (largeur mobile) ;
  `npm run lint` et `npm run build` passent.
- **Données** : compter les lignes (par exemple par tables) après toute opération de
  seed ; vérifier les IDs réels en base avant de coder des filtres en dur.
- **Sécurité** : vérifier qu'aucun secret ne sort dans les logs/réponses ; vérifier
  qu'une route privée refuse un utilisateur non autorisé.

## 7. Règles de travail

- **Ne jamais committer ni pousser sans demande explicite.**
- Ne jamais modifier `backend_django/.env` ni en exposer le contenu.
- Ne jamais installer une dépendance sans explication et accord.
- Si une tâche semble ambiguë ou dangereuse : s'arrêter et demander.
- Le projet évolue par étapes validées ; une étape terminée = démontrée et expliquée.
- L'utilisateur dirige : on ne part pas en avance sur une fonctionnalité non demandée.

## 8. Rappels spécifiques au projet

- Les IDs des tables de référence ne suivent pas 1,2,3… (compteurs AUTO_INCREMENT
  non réinitialisés après les purges) : toujours vérifier les valeurs réelles en base.
- Les inserts SQL bruts doivent fournir `created_at`/`submitted_at`/`decided_at`
  explicitement (les défauts ne sont définis que côté Python).
- La base contient des données fictives de démonstration (11 établissements,
  399 lignes au total) : à préserver pour les démos et les tests de recherche.
- L'interface est en anglais et en français ; la langue suit le navigateur à la
  première visite, puis le choix du visiteur.