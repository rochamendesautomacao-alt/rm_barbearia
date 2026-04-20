#!/bin/bash

# Uso: ./scripts/deploy.sh "mensagem do commit"
# Se não passar mensagem, usa "chore: atualização"

MSG="${1:-chore: atualização}"

echo "→ Verificando alterações..."
git status --short

if [ -z "$(git status --porcelain)" ]; then
  echo "✓ Nada para commitar."
  exit 0
fi

echo ""
echo "→ Adicionando arquivos..."
git add -A

echo "→ Commitando: \"$MSG\""
git commit -m "$MSG"

echo "→ Enviando para o GitHub / Vercel..."
git push origin main

echo ""
echo "✓ Deploy iniciado! Acompanhe em: https://vercel.com/dashboard"
