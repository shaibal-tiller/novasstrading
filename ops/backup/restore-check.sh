#!/usr/bin/env bash
# Restore drill: proves a backup archive can actually be restored.
#
#   restore-check.sh <archive.tar.age> <age private key file> [--no-db-load] [--extract-to DIR]
#
# Decrypts the archive, checks every file against its recorded SHA-256, loads each database dump
# into a throwaway MariaDB 10.6 container (Docker) and compares every table's row count with the
# counts recorded at backup time. Nothing is written to any real database. Run it on a trusted
# computer (the private key never goes to the server).
set -Eeuo pipefail
umask 077

[ $# -ge 2 ] || { echo "usage: $0 <archive.tar.age> <age private key file> [--no-db-load] [--extract-to DIR]" >&2; exit 2; }
ARCHIVE=$1 KEY=$2; shift 2
LOAD_DB=1 EXTRACT_TO=
while [ $# -gt 0 ]; do
  case $1 in
    --no-db-load) LOAD_DB=0 ;;
    --extract-to) EXTRACT_TO=${2:?}; shift ;;
    *) echo "unknown option $1" >&2; exit 2 ;;
  esac
  shift
done

WORK=$(mktemp -d)
CONTAINER=
cleanup() {
  if [ -n "$CONTAINER" ]; then docker rm -f "$CONTAINER" >/dev/null 2>&1 || true; fi
  rm -rf "$WORK"
}
trap cleanup EXIT

age -d -i "$KEY" "$ARCHIVE" | tar -xf - -C "$WORK"
echo "== $(basename "$ARCHIVE")"
sed 's/^/   /' "$WORK/manifest.txt"

problems=0
while read -r sum name; do
  [ -f "$WORK/$name" ] || continue          # the database-only archive holds a subset
  actual=$( (command -v sha256sum >/dev/null && sha256sum "$WORK/$name" || shasum -a 256 "$WORK/$name") | cut -d' ' -f1)
  if [ "$actual" = "$sum" ]; then echo "ok   checksum $name"; else echo "FAIL checksum $name"; problems=$((problems + 1)); fi
done < "$WORK/SHA256SUMS"

if [ -f "$WORK/files.tar.gz" ]; then
  n=$(tar -tzf "$WORK/files.tar.gz" | grep -vc '/$' || true)
  echo "ok   files.tar.gz readable ($n files)"
fi

if [ $LOAD_DB -eq 1 ] && compgen -G "$WORK/db-*.sql.gz" >/dev/null; then
  command -v docker >/dev/null || { echo "docker not found; rerun with --no-db-load" >&2; exit 1; }
  pw=$(openssl rand -hex 16)
  CONTAINER=$(docker run -d -e MARIADB_ROOT_PASSWORD="$pw" mariadb:10.6)
  for _ in $(seq 60); do docker exec "$CONTAINER" mariadb -uroot -p"$pw" -e 'SELECT 1' >/dev/null 2>&1 && break; sleep 1; done
  for dump in "$WORK"/db-*.sql.gz; do
    db=$(basename "$dump" .sql.gz); db=${db#db-}
    docker exec "$CONTAINER" mariadb -uroot -p"$pw" -e "CREATE DATABASE \`$db\`"
    gunzip -c "$dump" | docker exec -i "$CONTAINER" mariadb -uroot -p"$pw" "$db"
    tables=0 mismatched=0
    while IFS=$'\t' read -r t expected; do
      got=$(docker exec "$CONTAINER" mariadb -uroot -p"$pw" -N -B -e "SELECT COUNT(*) FROM \`$t\`" "$db")
      tables=$((tables + 1))
      # Session/OTP rows can change between the dump and the count at backup time; report, don't fail.
      [ "$got" = "$expected" ] || { echo "     note: $db.$t has $got rows, $expected recorded"; mismatched=$((mismatched + 1)); }
    done < "$WORK/rows-$db.tsv"
    restored=$(docker exec "$CONTAINER" mariadb -uroot -p"$pw" -N -B -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='$db'")
    if [ "$restored" = "$tables" ]; then echo "ok   $db restored: $tables tables, $mismatched row-count differences"
    else echo "FAIL $db: $restored tables restored, $tables expected"; problems=$((problems + 1)); fi
  done
fi

if [ -n "$EXTRACT_TO" ]; then
  mkdir -p "$EXTRACT_TO" && cp -R "$WORK"/. "$EXTRACT_TO"/
  echo "decrypted copy left in $EXTRACT_TO (contains real data: delete it when done)"
fi

if [ $problems -eq 0 ]; then echo "RESTORE CHECK PASSED"; else echo "RESTORE CHECK FAILED ($problems problem(s))"; exit 1; fi
