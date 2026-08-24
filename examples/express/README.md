# Express mini-shop

Standalone example that installs [`@mainmoney/sdk`](https://github.com/MainMoney-Inc/mm_aggr_nodejs_sdk)
as a yarn package. Same shop API as the Python and Laravel examples.

Default port: **8004**.

## Setup

```bash
cp .env.example .env
# set MM_CLIENT_ID, MM_API_SECRET, and MM_WEBHOOK_SECRET
yarn
./scripts/reset-db
```

Until npm lists `@mainmoney/sdk`, yarn installs it from GitHub (see `package.json`).

```bash
yarn seed
```

Update `data/initial.sqlite3` only when the schema or catalog changes:

```bash
yarn seed
./scripts/export-initial-db
```

Do not commit `db.sqlite3`.

## Run

```bash
yarn dev
```

Then start a JS frontend example:

```
VITE_MERCHANT_BACKEND_URL=http://127.0.0.1:8004
```

Aggregator webhooks cannot reach `localhost`. Use a tunnel for `POST /webhooks`.
Status polling works without a public URL.
