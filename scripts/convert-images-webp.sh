#!/usr/bin/env bash
# Génère un jumeau .webp pour chaque PNG/JPEG de public/ qui n'en a pas encore.
# BlurImage.tsx détecte automatiquement le .webp et garde le PNG/JPEG en fallback.
#
# Usage : bash scripts/convert-images-webp.sh [--force]
#   --force : régénère même si le .webp existe déjà.
set -euo pipefail

QUALITY=80
ROOT="$(cd "$(dirname "$0")/.." && pwd)/public"
FORCE="${1:-}"

if ! command -v cwebp >/dev/null 2>&1; then
  echo "Erreur : cwebp introuvable. Installe-le avec : brew install webp" >&2
  exit 1
fi

converted=0
skipped=0
saved_bytes=0

while IFS= read -r -d '' f; do
  base="${f%.*}"
  webp="${base}.webp"
  if [ -f "$webp" ] && [ "$FORCE" != "--force" ]; then
    skipped=$((skipped + 1))
    continue
  fi
  src_size=$(stat -f%z "$f" 2>/dev/null || echo 0)
  cwebp -quiet -q "$QUALITY" "$f" -o "$webp"
  out_size=$(stat -f%z "$webp" 2>/dev/null || echo 0)
  saved_bytes=$((saved_bytes + src_size - out_size))
  converted=$((converted + 1))
  printf '  %s  (%d Ko -> %d Ko)\n' "${f#"$ROOT"/}" "$((src_size / 1024))" "$((out_size / 1024))"
done < <(find "$ROOT" -type f \( -iname "*.png" -o -iname "*.jpg" -o -iname "*.jpeg" \) -print0)

echo ""
echo "Converties : $converted   |   déjà à jour : $skipped"
echo "Gain estimé : $((saved_bytes / 1024 / 1024)) Mo (servi en WebP au lieu de l'original)"
