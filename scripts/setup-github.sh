#!/bin/bash
# Creates GitHub repo 'dropship-crm' under the authenticated user and pushes all code.
set -e

if [ -z "$GITHUB_PAT" ]; then
  echo "ERROR: GITHUB_PAT env variable not set"
  exit 1
fi

REPO_NAME="dropship-crm"
GITHUB_USER=$(curl -sH "Authorization: token $GITHUB_PAT" https://api.github.com/user | python3 -c "import sys,json;print(json.load(sys.stdin)['login'])")

echo "Creating GitHub repo '$REPO_NAME' for user '$GITHUB_USER'..."

curl -s -H "Authorization: token $GITHUB_PAT" \
  -H "Content-Type: application/json" \
  https://api.github.com/user/repos \
  -d "{\"name\":\"$REPO_NAME\",\"private\":false,\"description\":\"Dropshipping Platform & CRM Monorepo\"}"

cd "$(dirname "$0")/.."

git init
git add .
git commit -m "Initial commit: dropship-crm monorepo"
git branch -M main
git remote add origin "https://$GITHUB_PAT@github.com/$GITHUB_USER/$REPO_NAME.git" 2>/dev/null || \
  git remote set-url origin "https://$GITHUB_PAT@github.com/$GITHUB_USER/$REPO_NAME.git"
git push -u origin main

echo "✅ Repository pushed to https://github.com/$GITHUB_USER/$REPO_NAME"
