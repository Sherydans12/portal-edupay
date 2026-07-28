#!/bin/sh
set -e

export DATABASE_URL="postgresql://dummy:dummy@127.0.0.1:5432/dummy?schema=public"
export EDUPAY_API_URL="http://127.0.0.1:3001"

echo "== Running Next.js Build in isolated container environment =="
npx next build
