#!/bin/bash
# Deploy both apps to Vercel
set -e

if [ -z "$VERCEL_TOKEN" ]; then
  echo "ERROR: VERCEL_TOKEN not set"
  exit 1
fi

ROOT_DIR="$(dirname "$0")/.."

deploy_app() {
  local APP_DIR="$1"
  local APP_NAME="$2"
  echo ""
  echo "Deploying $APP_NAME..."
  cd "$ROOT_DIR/$APP_DIR"
  npx vercel --token "$VERCEL_TOKEN" \
    --name "$APP_NAME" \
    --yes \
    --env NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \
    --env NEXT_PUBLIC_SUPABASE_ANON_KEY="$NEXT_PUBLIC_SUPABASE_ANON_KEY" \
    --env SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" \
    --build-env NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \
    --build-env NEXT_PUBLIC_SUPABASE_ANON_KEY="$NEXT_PUBLIC_SUPABASE_ANON_KEY"
  echo "✅ $APP_NAME deployed"
}

deploy_app "apps/storefront" "dropship-storefront"
deploy_app "apps/admin" "dropship-admin"

echo ""
echo "🚀 Both apps deployed to Vercel!"
