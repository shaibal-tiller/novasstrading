#!/usr/bin/env bash
# Weekly encrypted backup: databases + uploaded files -> one age-encrypted archive.
#
#   nova-backup.sh <config>                     dump, encrypt, upload to Google Drive (+ GitHub), prune old copies
#   nova-backup.sh <config> --dry-run           build and encrypt locally, upload nothing
#   nova-backup.sh <config> --keep-local DIR    also copy the encrypted archives into DIR
#
# Silent on success (details go to ~/.nova-backup/<name>.log). Warnings and failures are
# printed to stderr, so cron emails them. Nothing unencrypted is left on disk afterwards.
# Only the PUBLIC age key lives on the server; decrypting needs the private key you keep offline.
set -Eeuo pipefail
umask 077

usage() { echo "usage: $0 <config> [--dry-run] [--keep-local DIR]" >&2; exit 2; }
[ $# -ge 1 ] || usage
CONF=$1; shift
DRY_RUN=0; KEEP_LOCAL=
while [ $# -gt 0 ]; do
  case $1 in
    --dry-run) DRY_RUN=1 ;;
    --keep-local) KEEP_LOCAL=${2:?--keep-local needs a directory}; shift ;;
    *) usage ;;
  esac
  shift
done

HERE=$(cd "$(dirname "$0")" && pwd)
STATE_DIR=${NOVA_BACKUP_HOME:-$HOME/.nova-backup}
export PATH="$STATE_DIR/bin:$HOME/bin:$PATH"
export RCLONE_LOG_LEVEL=ERROR   # rclone NOTICE lines (e.g. client_id warnings) would email on every run

# Defaults, overridden by the config file.
BACKUP_NAME=
DB_SOURCES=()          # "envphp:/path/.env.php" or "cnf:/path/client.cnf:dbname"
FILE_PATHS=()          # absolute paths, archived as-is (paths kept so a restore knows where they go)
AGE_RECIPIENTS=()      # age public keys (age1...)
DRIVE_REMOTE=          # e.g. gdrive:NovaSS-Backups/staging ; empty = skip Drive
GIT_REPO_DIR=          # clone of the private backups repo ; empty = skip GitHub
KEEP_WEEKLY=12
KEEP_MONTHLY=6
ALERT_EMAIL=           # gets an email when a run fails or finishes with warnings (local sendmail)
PHP_BIN=${PHP_BIN:-php}
# shellcheck source=/dev/null
. "$CONF"

[ -n "$BACKUP_NAME" ] || { echo "BACKUP_NAME is not set in $CONF" >&2; exit 2; }
[ ${#AGE_RECIPIENTS[@]} -gt 0 ] || { echo "AGE_RECIPIENTS is empty in $CONF" >&2; exit 2; }
[ ${#DB_SOURCES[@]} -gt 0 ] || [ ${#FILE_PATHS[@]} -gt 0 ] || { echo "nothing to back up in $CONF" >&2; exit 2; }

mkdir -p "$STATE_DIR"
LOG="$STATE_DIR/$BACKUP_NAME.log"
exec 3>>"$LOG"
log()  { printf '%s [%s] %s\n' "$(date -u +%FT%TZ)" "$BACKUP_NAME" "$*" >&3; }
notify() { # <subject> <body>
  if [ -n "$ALERT_EMAIL" ] && [ -x /usr/sbin/sendmail ]; then
    printf 'To: %s\nSubject: %s\n\n%s\n\nHost: %s\nLog: %s\n' "$ALERT_EMAIL" "$1" "$2" "$(hostname)" "$LOG" | /usr/sbin/sendmail -t || true
  fi
}
WARNINGS=()
warn() { log "WARNING: $*"; echo "nova-backup [$BACKUP_NAME] WARNING: $*" >&2; WARNINGS+=("$*"); }
fail() {
  log "FAILED: $*"; echo "nova-backup [$BACKUP_NAME] FAILED: $*" >&2
  # Only the main shell emails, so a failure inside a subshell is reported once.
  if [ "$BASHPID" = "$$" ]; then notify "Backup FAILED: $BACKUP_NAME" "The weekly backup did not complete: $*"; fi
  exit 1
}
trap 'fail "line $LINENO: $BASH_COMMAND"' ERR

need() { command -v "$1" >/dev/null 2>&1 || fail "missing tool: $1 (run install.sh)"; }
need age; need tar; need gzip; need sha256sum
[ ${#DB_SOURCES[@]} -eq 0 ] || { need mysqldump; need mysql; }
[ -z "$DRIVE_REMOTE" ] || [ $DRY_RUN -eq 1 ] || need rclone

# One run at a time per config.
if command -v flock >/dev/null 2>&1; then
  exec 9>"$STATE_DIR/$BACKUP_NAME.lock"
  flock -n 9 || fail "another backup for $BACKUP_NAME is still running"
fi

STAMP=$(date -u +%Y%m%d-%H%M%SZ)
NAME="nova-$BACKUP_NAME-$STAMP"
WORK=$(mktemp -d "$STATE_DIR/work.XXXXXX")
trap 'rm -rf "$WORK"' EXIT
PAYLOAD="$WORK/payload"
mkdir -p "$PAYLOAD"
log "start $NAME"

{
  echo "backup:   $NAME"
  echo "created:  $(date -u +%FT%TZ)"
  echo "host:     $(hostname)"
  echo "config:   $CONF"
} > "$PAYLOAD/manifest.txt"

# --- databases -------------------------------------------------------------
for src in "${DB_SOURCES[@]}"; do
  case $src in
    envphp:*)
      cnf="$WORK/db-$RANDOM.cnf"
      db=$("$PHP_BIN" "$HERE/db-cnf.php" "${src#envphp:}" "$cnf") || fail "cannot read database settings from ${src#envphp:}"
      ;;
    cnf:*)
      rest=${src#cnf:}; cnf=${rest%:*}; db=${rest##*:}
      [ -r "$cnf" ] || fail "cannot read $cnf"
      ;;
    *) fail "unknown DB source: $src" ;;
  esac
  if ! mysqldump --defaults-extra-file="$cnf" --single-transaction --quick --no-tablespaces \
      --hex-blob --default-character-set=utf8mb4 "$db" 2>"$WORK/dump.err" | gzip -9 > "$PAYLOAD/db-$db.sql.gz"; then
    fail "database dump of $db failed: $(tr '\n' ' ' < "$WORK/dump.err")"
  fi
  # Exact row counts, used by the restore check to prove a restore is complete.
  mysql --defaults-extra-file="$cnf" -N -B -e 'SHOW TABLES' "$db" | while IFS= read -r t; do
    printf '%s\t%s\n' "$t" "$(mysql --defaults-extra-file="$cnf" -N -B -e "SELECT COUNT(*) FROM \`$t\`" "$db")"
  done > "$PAYLOAD/rows-$db.tsv"
  if [ "${src%%:*}" = envphp ]; then rm -f "$cnf"; fi
  echo "database: $db ($(wc -l < "$PAYLOAD/rows-$db.tsv" | tr -d ' ') tables, $(du -k "$PAYLOAD/db-$db.sql.gz" | cut -f1) KB compressed)" >> "$PAYLOAD/manifest.txt"
  log "dumped $db"
done

# --- files -----------------------------------------------------------------
present=()
for p in "${FILE_PATHS[@]}"; do
  if [ -e "$p" ]; then present+=("${p#/}"); else warn "file path not found, skipped: $p"; fi
done
if [ ${#present[@]} -gt 0 ]; then
  # GNU tar exits 1 when a file changes while it is read (e.g. an upload mid-backup): not fatal.
  tar -czf "$PAYLOAD/files.tar.gz" -C / "${present[@]}" || [ $? -eq 1 ]
  echo "files:    ${present[*]/#//} ($(tar -tzf "$PAYLOAD/files.tar.gz" | grep -vc '/$' || true) files, $(du -k "$PAYLOAD/files.tar.gz" | cut -f1) KB compressed)" >> "$PAYLOAD/manifest.txt"
  log "archived ${#present[@]} path(s)"
fi

(cd "$PAYLOAD" && sha256sum -- * > SHA256SUMS)

# --- encrypt ---------------------------------------------------------------
recips=()
for r in "${AGE_RECIPIENTS[@]}"; do recips+=(-r "$r"); done
FULL="$WORK/$NAME.tar.age"
tar -cf - -C "$PAYLOAD" . | age "${recips[@]}" -o "$FULL"
DBONLY=
if compgen -G "$PAYLOAD/db-*.sql.gz" >/dev/null; then
  DBONLY="$WORK/$NAME-db.tar.age"
  (cd "$PAYLOAD" && tar -cf - manifest.txt SHA256SUMS db-*.sql.gz rows-*.tsv) | age "${recips[@]}" -o "$DBONLY"
fi
rm -rf "$PAYLOAD"
SIZE_KB=$(du -k "$FULL" | cut -f1)
log "encrypted $NAME.tar.age (${SIZE_KB} KB)"

if [ -n "$KEEP_LOCAL" ]; then
  mkdir -p "$KEEP_LOCAL"
  cp "$FULL" ${DBONLY:+"$DBONLY"} "$KEEP_LOCAL/"
fi

if [ $DRY_RUN -eq 1 ]; then
  log "dry run: nothing uploaded"
  echo "dry run OK: $NAME.tar.age, ${SIZE_KB} KB"
  exit 0
fi

# --- Google Drive ----------------------------------------------------------
prune() { # <remote dir> <keep>: delete all but the newest <keep> archives (names sort by date)
  { rclone lsf --files-only "$1" | grep -E "^nova-$BACKUP_NAME-[0-9]{8}-[0-9]{6}Z\.tar\.age$" || true; } | sort | head -n -"$2" |
    while IFS= read -r f; do rclone deletefile "$1/$f"; log "pruned $1/$f"; done
}
if [ -n "$DRIVE_REMOTE" ]; then
  rclone copyto "$FULL" "$DRIVE_REMOTE/weekly/$NAME.tar.age" --retries 5 --low-level-retries 20
  log "uploaded to $DRIVE_REMOTE/weekly"
  month=$(date -u +%Y%m)
  if ! rclone lsf --files-only "$DRIVE_REMOTE/monthly" 2>/dev/null | grep -q "^nova-$BACKUP_NAME-$month"; then
    rclone copyto "$DRIVE_REMOTE/weekly/$NAME.tar.age" "$DRIVE_REMOTE/monthly/$NAME.tar.age"
    log "kept as this month's copy in $DRIVE_REMOTE/monthly"
  fi
  prune "$DRIVE_REMOTE/weekly" "$KEEP_WEEKLY"
  prune "$DRIVE_REMOTE/monthly" "$KEEP_MONTHLY"
fi

# --- GitHub (database-only archive; small) ---------------------------------
if [ -n "$GIT_REPO_DIR" ] && [ -n "$DBONLY" ]; then
  if [ -f "$STATE_DIR/github_deploy_key" ]; then
    export GIT_SSH_COMMAND="ssh -i $STATE_DIR/github_deploy_key -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new"
  fi
  git -C "$GIT_REPO_DIR" pull -q --ff-only
  mkdir -p "$GIT_REPO_DIR/$BACKUP_NAME"
  cp "$DBONLY" "$GIT_REPO_DIR/$BACKUP_NAME/"
  # The working tree keeps the newest KEEP_WEEKLY; older ones stay reachable in git history.
  (cd "$GIT_REPO_DIR/$BACKUP_NAME" && ls | grep -E "^nova-$BACKUP_NAME-.*-db\.tar\.age$" | sort | head -n -"$KEEP_WEEKLY" | xargs -r git rm -q --)
  git -C "$GIT_REPO_DIR" add -- "$BACKUP_NAME"
  git -C "$GIT_REPO_DIR" commit -q -m "$BACKUP_NAME backup $STAMP"
  git -C "$GIT_REPO_DIR" push -q
  log "pushed database archive to GitHub"
fi

printf '{"backup":"%s","finished":"%s","size_kb":%s}\n' "$NAME" "$(date -u +%FT%TZ)" "$SIZE_KB" > "$STATE_DIR/$BACKUP_NAME.last"
log "done $NAME"
if [ ${#WARNINGS[@]} -gt 0 ]; then
  notify "Backup finished with warnings: $BACKUP_NAME" "$(printf -- '- %s\n' "${WARNINGS[@]}")"
fi
