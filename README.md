# HACCP Manager

Application de gestion du Plan de Maitrise Sanitaire (HACCP) pour une chaine de
restaurants multi-etablissements, livree comme application de bureau Windows
(Electron) avec un serveur embarque.

## Perimetre fonctionnel

- **Reception & tracabilite** : fournisseurs, produits, receptions avec numero
  de lot, DLC et controle de temperature a reception.
- **Suivi des temperatures** : equipements (frigos, congelateurs, chambres
  froides...) avec seuils min/max et alertes automatiques.
- **Controle de temperature en service** : verification de la liaison
  chaude/froide sur les plats servis.
- **Plan de nettoyage & desinfection** : zones, taches, frequences et
  validation d'execution.
- **Non-conformites & actions correctives** : declaration, suivi et
  resolution.
- **Autocontroles / audits internes** : grilles d'audit personnalisables,
  score de conformite, historique.
- **Gestion documentaire** : procedures, fiches techniques, PMS.
- **Personnel & formations** : comptes utilisateurs par role et par
  etablissement, suivi des habilitations (ex: formation HACCP obligatoire).
- **Multi-etablissements** : une organisation (chaine) regroupe plusieurs
  etablissements ; les administrateurs voient tout, les responsables et
  employes sont limites a leur etablissement.

## Stack technique

- **Backend** : Node.js, Express, Prisma ORM, SQLite (bascule facile vers
  PostgreSQL en production en changeant le `provider` dans
  `server/prisma/schema.prisma`).
- **Frontend** : React, Vite, React Router, Tailwind CSS.
- **Desktop** : Electron (le serveur Express tourne en local dans
  l'application, aucune installation externe requise), packaging Windows via
  `electron-builder` (installeur NSIS).

## Comptes de demonstration

Mot de passe pour tous les comptes : `haccp2024`

| Email | Role | Etablissement |
|---|---|---|
| admin@jazzbistrot.fr | Administrateur chaine | Tous |
| paris@jazzbistrot.fr | Responsable etablissement | Saint-Germain |
| lyon@jazzbistrot.fr | Responsable etablissement | Presqu'ile |
| employe@jazzbistrot.fr | Employe | Saint-Germain |

## Developpement

```bash
# installation des dependances (racine, serveur, client)
npm run install:all

# base de donnees locale
cd server
npx prisma migrate dev --name init
npm run seed
cd ..

# lancer le serveur (http://localhost:4000)
npm run dev:server

# dans un autre terminal : lancer le frontend en mode dev (http://localhost:5173)
cd client && npm run dev
```

## Lancer l'application de bureau (mode dev)

```bash
npm run start
```

Ceci construit le frontend puis lance Electron, qui demarre automatiquement
le serveur Express embarque.

## Construire l'installeur Windows

```bash
npm run pack:win
```

L'installeur `.exe` (NSIS) est genere dans `dist/`. Au premier lancement,
l'application copie une base de donnees de demonstration dans le dossier
utilisateur Windows (`%APPDATA%/HACCP Manager/haccp.db`) ; les donnees
saisies ensuite sont propres a chaque poste. Pour un usage en production
avec plusieurs etablissements partageant les memes donnees, remplacez SQLite
par une base PostgreSQL centrale (voir `server/prisma/schema.prisma`) et
adaptez `DATABASE_URL`.

> Remarque : la generation de l'installeur Windows depuis Linux/macOS
> necessite `wine` (utilise par electron-builder pour l'edition des
> ressources de l'executable).

## Structure du projet

```
server/     API Express + schema Prisma + scripts de seed
client/     Application React (Vite + Tailwind)
electron/   Point d'entree Electron (main.js / preload.js)
```
