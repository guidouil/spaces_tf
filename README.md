# Spaces.tf

MVP SvelteKit pour lancer un quiz live pendant un Twitter/X Space.

## Stack

- SvelteKit 2 + Svelte 5
- TypeScript
- Tailwind CSS v4
- PostgreSQL
- Drizzle ORM
- Server-Sent Events pour le live MVP

## Installation

```sh
npm install
cp .env.example .env
npm run db:start
npm run db:migrate
npm run dev
```

L'app tourne par defaut sur `http://localhost:5173`.

## Variables d'environnement

```sh
DATABASE_URL="postgres://root:mysecretpassword@localhost:5432/local"
ORIGIN="http://localhost:5173"
BETTER_AUTH_SECRET="une-valeur-longue-et-secrete"
```

Better Auth reste installe dans la base projet, mais le MVP Spaces.tf n'utilise pas de comptes.

## Commandes utiles

```sh
npm run dev          # serveur local
npm run check        # verification Svelte/TypeScript
npm run lint         # prettier + eslint
npm run db:start     # lance PostgreSQL via Docker
npm run db:generate  # genere une migration Drizzle
npm run db:migrate   # applique les migrations
npm run db:studio    # ouvre Drizzle Studio
```

## Parcours MVP

- `/` : landing et creation rapide de room.
- `/host/new` : creation d'une room.
- `/host/[slug]?token=...` : dashboard host.
- `/r/[slug]` : entree joueur, pseudo, question active, score live.
- `/r/[slug]/podium` : podium final.

## Regles de jeu

- Les joueurs rejoignent sans compte avec un pseudo unique par room.
- Le host cree et lance une question manuelle avec 2 a 4 reponses.
- Un joueur ne peut repondre qu'une fois a la question active.
- Bonne reponse : `+100` points.
- Le score et l'etat de room sont synchronises via SSE toutes les 1,5 secondes.
