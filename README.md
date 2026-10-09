# EduFinder Cameroon

## Auteur
**BISSOUTH Jean Jacques Kevin**  
Étudiant en Génie Logiciel  
Stage académique 2026 – OpenMind Academy

## Description du projet
EduFinder Cameroon est une plateforme web permettant aux parents, élèves, étudiants et autres utilisateurs de rechercher, consulter et comparer des établissements d'enseignement au Cameroun selon plusieurs critères (localisation, type d'établissement, frais de scolarité, formations, services, modalités de paiement). L'objectif est d'aider chaque utilisateur à trouver l'établissement correspondant le mieux à ses besoins, sans affirmer qu'un établissement est « le meilleur ».

La plateforme couvre :
- Écoles maternelles et primaires
- Collèges et lycées
- Universités, instituts supérieurs, grandes écoles
- Centres de formation professionnelle

## Problème résolu
Les informations sur les établissements étaient dispersées sur plusieurs supports (sites web, réseaux sociaux, groupes WhatsApp, recommandations, visites physiques), entraînant :
- Perte de temps
- Informations incomplètes ou obsolètes
- Difficulté à comparer les établissements
- Manque de transparence sur les frais et les formations

## Objectif général
Concevoir une plateforme centralisée permettant de rechercher, consulter et comparer les établissements d'enseignement au Cameroun de manière simple, rapide et efficace.

## Objectifs spécifiques
- Centraliser les informations des établissements
- Faciliter la recherche d'une école ou d'une formation
- Proposer une recherche multicritère
- Afficher les frais de scolarité et les modalités de paiement
- Présenter les formations et les résultats aux examens
- Permettre aux établissements de mettre à jour leurs informations
- Permettre au super administrateur de contrôler et valider les publications

## Technologies & Outils

### Backend
- **Django 5.2** et **Django REST Framework** (Python 3.12) - API REST
- **MySQL** via PyMySQL en développement, **SQLite** en production - Base de données
- **Migrations Django** - Évolution du schéma
- **bcrypt** - Hachage des mots de passe
- **JWT** dans un cookie httpOnly - Authentification
- **Sérialiseurs DRF** - Validation des entrées et format des sorties
- **pytest** et pytest-django - Tests

### Frontend
- **React 19** - Interface utilisateur
- **Vite** - Outil de build et serveur de développement
- **Tailwind CSS 4** - Mise en forme, avec les jetons de design du projet
- **Recharts** - Graphiques des tableaux de bord
- **Leaflet** - Carte de localisation
- **Axios** - Client HTTP
- **lucide-react** - Pictogrammes
- **i18next** et react-i18next - Interface en anglais et en français

### Base de données
- **MySQL** `edufinder_db` en développement
- **SQLite** là où MySQL n'est pas offert : `DATABASE_URL=sqlite:///fichier.sqlite3`

### Outils de développement
- **Git & GitHub** - Gestion des versions
- **DBeaver** - Administration de la base de données
- **Draw.io** - Diagrammes
- **VS Code** - Environnement de développement

## Pré-requis

### Backend
- Python 3.12 installé
- Serveur MySQL démarré, avec une base `edufinder_db`
- Fichier `.env` dans `backend_django/` (modèle : `.env.example`) avec :
  - `SECRET_KEY` - clé de signature des jetons
  - `DATABASE_URL` - par exemple `mysql+pymysql://user:password@localhost:3306/edufinder_db`
  - `CORS_ORIGINS` - origines autorisées, par exemple `["http://localhost:5173"]`
  - `ALLOWED_HOSTS` - hôtes servis, par exemple `["localhost", "127.0.0.1"]`
  - `DEBUG`, `ACCESS_TOKEN_EXPIRE_MINUTES`, `COOKIE_SECURE` - optionnels

### Frontend
- Node.js et npm installés

## Installation

### Backend
```bash
cd backend_django
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env  # Éditer les valeurs
```

### Base de données
```bash
# Créer la base edufinder_db sur MySQL, puis appliquer les migrations
cd backend_django
python manage.py migrate
```

### Frontend
```bash
cd frontend
npm install
```

## Lancement

### Mode développement

```bash
# Terminal 1 : Backend
cd backend_django
DEBUG=true python manage.py runserver 8000

# Terminal 2 : Frontend
cd frontend
npm run dev
```

L'application sera accessible sur :
- Frontend : http://localhost:5173
- Backend API : http://localhost:8000

Sans variable `VITE_API_URL`, le site appelle l'API sur la machine qui sert la page,
port 8000. Pour l'ouvrir depuis un téléphone du même réseau, lancer `npm run dev -- --host`
et `python manage.py runserver 0.0.0.0:8000`, en ajoutant l'adresse de la machine à
`ALLOWED_HOSTS` et `CORS_ORIGINS`.

### Tests backend
```bash
cd backend_django
python -m pytest
```

### Vérifications frontend
```bash
cd frontend
npm run lint          # règles de code
npm run check:i18n    # mêmes textes en anglais et en français, aucune clé manquante
npm test              # tests unitaires (règles de comparaison, routes, examens par type)
npm run build         # compilation de production
```

### Définir le mot de passe d'un compte
```bash
cd backend_django
python manage.py set_account_password <email>   # le mot de passe est demandé, jamais affiché
```

## Fonctionnalités V1 (terminées)

### Côté public (visiteur)
1. ✅ Page d'accueil présentant le service
2. ✅ Liste des établissements publiés
3. ✅ Fiche détaillée d'un établissement
4. ✅ Recherche par nom
5. ✅ Recherche par ville
6. ✅ Recherche par type d'établissement (primaire, secondaire, supérieur)
7. ✅ Recherche par section linguistique (francophone, anglophone, bilingue)
8. ✅ Recherche multicritère (combinaison de plusieurs filtres)
9. ✅ Réinitialisation des critères de recherche
10. ✅ Filtrage des écoles primaires/secondaires par classe
11. ✅ Filtrage des établissements supérieurs par filière et niveau
12. ✅ Filtre budget maximal
13. ✅ Filtre modalités de paiement (1 tranche, 2 tranches, trimestriel, etc.)
14. ✅ Affichage des frais par classe/filière/niveau
15. ✅ Affichage des tranches de paiement séparément
16. ✅ Affichage des résultats aux examens par année
17. ✅ Contacts et localisation sur la fiche
18. ✅ Galerie d'images disponible
19. ✅ Recherche par mot-clé (name/ville/quarter)

### Côté administrateur
20. ✅ Connexion administrateur établissement
21. ✅ Compléter les informations de son établissement
22. ✅ Empêcher modification d'une autre école (403 forbidden)
23. ✅ Super admin peut consulter toutes les écoles
24. ✅ Super admin peut accepter/refuser une publication
25. ✅ Masquer établissements non publiés ou suspendus

### Règles métiers V1
- Seuls les établissements `published` sont visibles publiquement
- Multi-criteria search: tous les critères sélectionnés doivent être satisfaits
- Workflow: Draft → Submission → Admin validation → Publication
- Un administrateur ne peut gérer que ses établissements associés (table `user_establishment`)
- Les informations non validées ne sortent jamais des endpoints publics

## Endpoints API principaux

### Public
- `GET /health` - Vérification de la connexion à la base
- `GET /institutions` - Liste avec filtres
- `GET /institutions/{uuid}` - Fiche détaillée
- `GET /stats` - Statistiques de la plateforme
- `GET /filters-meta` - Métadonnées pour les filtres
- `GET /reference-labels` - Libellés français et anglais des listes de référence
- `POST /institutions/{uuid}/track-view` - Compte une visite
- `POST /institutions/{uuid}/track-inquiry` - Compte une demande de contact

### Authentification
- `POST /auth/login` - Connexion (pose le cookie de session)
- `POST /auth/logout` - Déconnexion
- `GET /auth/me` - Profil du compte connecté

### Responsable d'établissement
- `GET /my/establishments` - Mes établissements
- `GET /my/establishments/{uuid}` - Détail d'un établissement géré
- `GET /my/establishments/{uuid}/benchmarks` - Comparaison avec les établissements du même type
- `GET /my/establishments/{uuid}/activity` - Visites et demandes de contact, jour par jour
- `GET /my/submissions` - Mes soumissions
- `POST /establishments/proposals` - Proposer un nouvel établissement
- `POST /my/establishments/{uuid}/modification-proposals` - Proposer une modification
- `POST /my/uploads/media` - Téléverser un fichier avant une proposition
- `POST /my/establishments/{uuid}/media` - Proposer l'ajout d'un média
- `DELETE /my/establishments/{uuid}/media/{id}` - Proposer le retrait d'un média
- `PUT /my/establishments/{uuid}/director-photo` - Proposer une photo du responsable

### Super administrateur
- `GET /admin/submissions` - Soumissions, filtrées par état
- `GET /admin/submissions/{uuid}` - Détail d'une soumission
- `POST /admin/submissions/{uuid}/approve` - Approuver
- `POST /admin/submissions/{uuid}/reject` - Refuser (motif requis)
- `GET /admin/establishments` - Tous les établissements
- `POST /admin/establishments/{uuid}/suspend` - Suspendre (motif requis)
- `POST /admin/establishments/{uuid}/reactivate` - Réactiver
- `GET /admin/activity` - Visites et demandes de contact de la plateforme

### Notifications (responsable et super administrateur)
- `GET /notifications` - Mes notifications et le nombre de non lues
- `POST /notifications/{uuid}/read` - Marquer une notification comme lue
- `POST /notifications/read-all` - Tout marquer comme lu

## Données de démonstration

La base contient des données fictives de démonstration :
- 13 établissements, dont 11 publiés et 2 suspendus : 1 primaire, 4 secondaires,
  4 instituts supérieurs et 2 universités parmi les publiés
- 8 villes dans 8 régions
- Établissements francophones, anglophones et bilingues
- Diverses classes (maternelle à Master), 7 filières
- Trois modalités de paiement (1, 2 ou 3 tranches)
- Résultats d'examens (CEP, BEPC, Probatoire, Baccalauréat, CAP, BTS, GCE)
- Médias (images, vidéos, PDF)
- Comptes : 2 responsables, 1 super administrateur

## Limites (non traitées en V1)

- Couverture incomplete du Cameroun (échantillon de démonstration)
- Garantie juridique des informations publiées
- Paiement en ligne des frais scolaires
- Gestion complète des inscriptions scolaires
- Avis publics des visiteurs
- Application mobile séparée
- Intelligence artificielle pour recommandation
- Cours en ligne
- Suivi présence/absences
- Recherche géolocalisée automatique (optionnelle)
- Historique détaillé des modifications
- Export de fiche en document
- Suggestions d'établissements proches

## Structure du projet

```
EduFinder-Cameroon/
├── backend_django/           # API Django REST Framework
│   ├── manage.py
│   ├── config/               # Réglages (.env), routes racine, vue de santé
│   ├── edufinder/
│   │   ├── models/           # Modèles de la base
│   │   ├── migrations/       # Migrations Django
│   │   ├── serializers/      # Validation des entrées, format des sorties
│   │   ├── services/         # Logique métier
│   │   ├── views/            # Vues par espace (public, auth, manager, admin…)
│   │   └── urls.py           # Routes de l'API
│   ├── tests/                # Tests pytest
│   ├── requirements.txt
│   └── .env                  # Secrets (JAMAIS commité)
├── frontend/                 # React + Vite
│   ├── src/
│   │   ├── pages/            # Accueil, fiche, connexion, espaces privés
│   │   ├── components/       # ui, school-profile, workspace, charts, manager, admin
│   │   ├── hooks/            # État et appels API
│   │   ├── utils/            # Authentification, formats, médias
│   │   ├── i18n/             # Choix de langue et textes (locales/en, locales/fr)
│   │   └── routes.js         # Routage par hash
│   └── package.json
├── media/                    # Fichiers téléversés (images, vidéos, PDF)
├── docs/                     # Documents du sujet
└── README.md                 # Ce fichier
```

## Notes importantes

- **Sécurité**: Aucun secret dans le code, le `.env` n'est jamais committed
- **Visibilité**: Seules les établissements `status == published` apparaissent en public
- **Autorisation**: Routes privées vérifient l'appartenance `user_establishment` (403 sinon)
- **Données**: Base de démonstration fictive (13 établissements, environ 500 lignes)
- **Langues**: aucun texte visible n'est écrit en dur dans un composant ; il passe par
  les fichiers `frontend/src/i18n/locales/`, vérifiés par `npm run check:i18n`
- **Responsive**: Interface utilisable sur ordinateur, tablette, téléphone