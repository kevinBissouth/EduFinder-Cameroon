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
- **FastAPI** (Python 3.12) - API REST
- **SQLModel** / SQLAlchemy - ORM pour MySQL
- **Alembic** - Gestion des migrations de base de données
- **bcrypt** - Hashage des mots de passe
- **JWT** - Authentification par token
- **Pydantic** - Validation des schémas

### Frontend
- **React** - Interface utilisateur
- **Vite** - Build tool et développement
- **Tailwind CSS 4** - Mise en forme
- **DaisyUI** - Composants UI prêts à l'emploi
- **Axios** - Client HTTP

### Base de données
- **POSTGret** `edufinder_db` - Stockage des données
- **19 tables** conformes au MLD (Modèle Logique de Données)

### Outils de développement
- **Git & GitHub** - Gestion des versions
- **DBeaver** - Administration de la base de données
- **Draw.io** - Diagrammes
- **Vs Code** - Environnement de debeloppement

## Pré-requis

### Backend
- Python 3.12 installé
- POstgres server running
- Variable d'environnement `.env` dans `backend/` avec :
  - `DATABASE_URL=mysql+pymysql://user:password@localhost:3306/edufinder_db`
  - `SECRET_KEY` pour JWT
  - `CORS_ORIGINS` (ex: http://localhost:5173)

### Frontend
- Node.js et npm installés
- Vite configuration

## Installation

### Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env  # Éditer les valeurs
```

### Base de données
```bash
# Créer la base edufinder_db sur PostGres
# Appliquer les migrations
cd backend
alembic upgrade head
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
cd backend
uvicorn app.main:app --reload --port 8000

# Terminal 2 : Frontend  
cd frontend
npm run dev
```

L'application sera accessible sur :
- Frontend : http://localhost:5173
- Backend API : http://127.0.0.1:8000
- Documentation API : http://127.0.0.1:8000/docs

### Tests backend
```bash
cd backend
pytest
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
- `GET /health` - Vérification connexion DB
- `GET /institutions` - Liste avec filtres
- `GET /institutions/{uuid}` - Fiche détaillée
- `GET /stats` - Statistiques plateforme
- `GET /filters-meta` - Métadonnées pour les filtres
- `POST /institutions/{uuid}/track-view` - Compteur de vues
- `POST /institutions/{uuid}/track-inquiry` - Compteur de demandes

### Authentification
- `POST /auth/login` - Connexion
- `GET /auth/me` - Profil utilisateur

### Manager (administrateur établissement)
- `POST /establishments/proposals` - Soumettre création/modification
- `GET /my/establishments` - Mes établissements
- `GET /my/submissions` - Mes soumissions
- `PUT /my/establishments/{uuid}/media` - Upload médias (5MB max)
- `GET /my/establishments/{establishment_uuid}/benchmarks` - Comparaisons

### Admin (super administrateur)
- `GET /admin/submissions` - Liste soumissions en attente
- `POST /admin/submissions/{id}/approve` - Valider
- `POST /admin/submissions/{id}/reject` - Refuser (motif requis)
- `PATCH /establishments/{id}/statut` - Suspendre/réactiver

## Données de démonstration

La base contient des données fictives de démonstration :
- 11 établissements (3 primaires, 3 secondaires, 3 supérieurs, 1 pending, 1 suspended)
- 3 villes (Yaoundé, Douala, et une autre)
- Établissements francophones, anglophones et bilingues
- Diverses classes (CP à Terminale), filières (Informatique, Sciences, etc.)
- Plusieurs plans de paiement (1 tranche, 2 tranches, trimestriel)
- Résultats d'examens (CEP, BEPC, Baccalauréat)
- Médias (images, PDFs)
- Comptes: 1 manager, 1 super_admin

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
├── backend/                  # API FastAPI
│   ├── app/
│   │   ├── main.py           # Point d'entrée FastAPI
│   │   ├── api/routes.py     # Endpoints (public, auth, manager, admin)
│   │   ├── core/config.py    # Settings (.env)
│   │   ├── db/session.py     # Engine SQLModel + get_db
│   │   ├── models/           # Tables SQLModel (19 tables)
│   │   ├── schemas/          # Schémas Pydantic
│   │   └── services/         # Logique métier
│   ├── tests/                # Tests pytest
│   └── .env                  # Secrets (JAMAIS committed)
├── frontend/                 # React + Vite
│   ├── src/
│   │   ├── pages/            # HomePage, SchoolProfilePage, etc.
│   │   ├── components/       # Filters, Results, School-profile sections
│   │   ├── hooks/            # useInstitutions, usePlatformStats
│   │   └── routes.js         # Routage hash-based
│   └── package.json
├── media/                    # Fichiers uploadés (images, PDFs)
├── alembic/                  # Migrations database
├── tests/                    # Tests backend (racine)
└── README.md                # Ce fichier
```

## Notes importantes

- **Sécurité**: Aucun secret dans le code, le `.env` n'est jamais committed
- **Visibilité**: Seules les établissements `status == published` apparaissent en public
- **Autorisation**: Routes privées vérifient l'appartenance `user_establishment` (403 sinon)
- **Données**: Base MySQL de démonstration (11 établissements, 399 lignes au total)
- **Responsive**: Interface utilisable sur ordinateur, tablette, téléphone