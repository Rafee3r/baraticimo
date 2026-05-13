# Baratícimo

App móvil + web para comparar precios de productos entre supermercados (Jumbo, Líder, Santa Isabel, Tottus, Unimarc) y farmacias (Cruz Verde, Salcobrand, Ahumada) en Chile.

## Estructura

```
apps/
  web/          Next.js 15 (App Router)
  mobile/       Expo (React Native)
packages/
  types/        Tipos compartidos entre clientes y backend
  config/       Configs compartidas (ESLint, TS)
services/
  api/          Backend Hono + tRPC + Prisma
  scrapers/     Workers de scraping por cadena
  matcher/      Worker de matching de productos con IA
infra/
  prisma/       Schema y migraciones
  docker-compose.yml
```

## Setup local

```bash
pnpm install
cp .env.example .env
docker compose -f infra/docker-compose.yml up -d
pnpm db:migrate
pnpm db:seed
pnpm dev
```

## Scraping

Pipeline híbrido:
1. Scrapers fijos consumen APIs VTEX (Jumbo, Líder, Santa Isabel, Tottus, las 3 farmacias).
2. Unimarc → Playwright + parser HTML con fallback IA (DeepSeek).
3. Matcher IA empareja SKUs entre cadenas hacia un `product` canónico.

Frecuencia: 1×/día por cadena, escalonado.
