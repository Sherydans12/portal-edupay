#!/bin/sh
set -e

# Force dummy values during static compilation, independent of runtime services.
export DATABASE_URL="postgresql://dummy:dummy@127.0.0.1:5432/dummy?schema=public"
export EDUPAY_API_URL="http://127.0.0.1:3001"
export NEXTAUTH_SECRET="${NEXTAUTH_SECRET:-build-time-secret-key-at-least-32-bytes-long}"
export NEXTAUTH_URL="${NEXTAUTH_URL:-http://localhost:3000}"
export NEXT_PUBLIC_APP_URL="${NEXT_PUBLIC_APP_URL:-http://localhost:3000}"
export NEXT_PUBLIC_TENANT_ID="${NEXT_PUBLIC_TENANT_ID:-colegio-conquistadores}"
export WEBPAY_COMMERCE_CODE="${WEBPAY_COMMERCE_CODE:-597053086789}"
export WEBPAY_API_KEY="${WEBPAY_API_KEY:-a2317ccd-9123-4de9-94bf-a980014adca2}"
export WEBPAY_ENVIRONMENT="${WEBPAY_ENVIRONMENT:-integration}"

echo "== Running Next.js Build inside Docker =="
npx next build
