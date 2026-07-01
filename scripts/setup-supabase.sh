#!/bin/bash
# Apply migrations to Supabase using the Supabase Management API
set -e

if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "ERROR: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set"
  exit 1
fi

MIGRATION_FILE="$(dirname "$0")/../supabase/migrations/001_initial_schema.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
  echo "ERROR: Migration file not found at $MIGRATION_FILE"
  exit 1
fi

echo "Applying migration: 001_initial_schema.sql..."

SQL=$(cat "$MIGRATION_FILE")

RESPONSE=$(curl -s -X POST \
  "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/rpc/exec_sql" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"sql\": $(echo "$SQL" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')}")

echo "Response: $RESPONSE"

echo ""
echo "✅ Migration applied. If you see errors, run the SQL manually in the Supabase SQL editor:"
echo "   $NEXT_PUBLIC_SUPABASE_URL"
echo ""
echo "Or use the Supabase CLI:"
echo "   npx supabase db push --db-url <your-db-url>"
