#!/bin/sh
set -eu

DATA_DIRECTORY="${DATA_DIRECTORY:-/data}"
mkdir -p "$DATA_DIRECTORY/d1"

node /app/docker/prepare-runtime.mjs

if [ ! -f "$DATA_DIRECTORY/.arena-db-initialized" ]; then
  node /app/node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config /app/dist/server/wrangler.json --persist-to "$DATA_DIRECTORY/d1" --file /app/drizzle/0000_wakeful_thor.sql
  touch "$DATA_DIRECTORY/.arena-db-initialized"
fi

if [ ! -f "$DATA_DIRECTORY/.arena-db-classroom-admin-v1" ]; then
  node /app/node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config /app/dist/server/wrangler.json --persist-to "$DATA_DIRECTORY/d1" --file /app/drizzle/0001_classroom_admin.sql
  touch "$DATA_DIRECTORY/.arena-db-classroom-admin-v1"
fi

if [ ! -f "$DATA_DIRECTORY/.arena-db-batches-mcq-v1" ]; then
  node /app/node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config /app/dist/server/wrangler.json --persist-to "$DATA_DIRECTORY/d1" --file /app/drizzle/0002_batches_mcq.sql
  touch "$DATA_DIRECTORY/.arena-db-batches-mcq-v1"
fi

if [ ! -f "$DATA_DIRECTORY/.arena-db-batch-access-v1" ]; then
  node /app/node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config /app/dist/server/wrangler.json --persist-to "$DATA_DIRECTORY/d1" --file /app/drizzle/0003_batch_access.sql
  touch "$DATA_DIRECTORY/.arena-db-batch-access-v1"
fi

exec node --import /app/scripts/sites-env.mjs /app/node_modules/wrangler/bin/wrangler.js dev --config /app/dist/server/wrangler.json --local --persist-to "$DATA_DIRECTORY/d1" --ip 0.0.0.0 --port "${PORT:-8080}" --inspector-port 0
