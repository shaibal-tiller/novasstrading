#!/usr/bin/env bash
# One-time (and re-runnable) setup of the weekly backup on the cPanel server.
#
#   bash ~/novass-src/ops/backup/install.sh
#
# Installs pinned, checksum-verified copies of age and rclone into ~/.nova-backup/bin, copies the
# backup scripts and the staging config into ~/.nova-backup, and creates the GitHub deploy key.
# It does not touch websites, mail, databases or the crontab.
set -Eeuo pipefail
umask 077

HERE=$(cd "$(dirname "$0")" && pwd)
STATE_DIR=$HOME/.nova-backup
BIN=$STATE_DIR/bin
mkdir -p "$BIN"
chmod 700 "$STATE_DIR"

[ "$(uname -s)-$(uname -m)" = Linux-x86_64 ] || { echo "expected Linux x86_64, got $(uname -sm)" >&2; exit 1; }

AGE_VERSION=v1.3.2
AGE_SHA256=cbe24006683f8eb669266162894b9a522a1af52f2665fbc63a4bb032ed26ac10
RCLONE_VERSION=v1.75.1
RCLONE_SHA256=982b5aa772841168f8e380f139e9e787b2a105403e32b94da8676a0e1c0a13ab

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

fetch() { # <url> <sha256> <out>
  curl -fsSL --retry 3 -o "$3" "$1"
  echo "$2  $3" | sha256sum -c --quiet - || { echo "checksum mismatch for $1 - not installing" >&2; exit 1; }
}

if [ "$("$BIN/age" --version 2>/dev/null)" != "$AGE_VERSION" ]; then
  fetch "https://github.com/FiloSottile/age/releases/download/$AGE_VERSION/age-$AGE_VERSION-linux-amd64.tar.gz" "$AGE_SHA256" "$tmp/age.tgz"
  tar -xzf "$tmp/age.tgz" -C "$tmp"
  install -m 755 "$tmp/age/age" "$BIN/age"
fi
if ! "$BIN/rclone" version 2>/dev/null | head -1 | grep -q "rclone $RCLONE_VERSION$"; then
  fetch "https://downloads.rclone.org/$RCLONE_VERSION/rclone-$RCLONE_VERSION-linux-amd64.zip" "$RCLONE_SHA256" "$tmp/rclone.zip"
  if command -v unzip >/dev/null; then unzip -q "$tmp/rclone.zip" -d "$tmp"
  else python3 -m zipfile -e "$tmp/rclone.zip" "$tmp"; fi
  install -m 755 "$tmp/rclone-$RCLONE_VERSION-linux-amd64/rclone" "$BIN/rclone"
fi
echo "age    $("$BIN/age" --version)"
echo "rclone $("$BIN/rclone" version | head -1)"

install -m 700 "$HERE/nova-backup.sh" "$STATE_DIR/nova-backup.sh"
install -m 600 "$HERE/db-cnf.php" "$STATE_DIR/db-cnf.php"
for conf in staging production; do
  if [ ! -f "$HERE/$conf.conf" ]; then continue; fi
  if [ -e "$STATE_DIR/$conf.conf" ]; then
    echo "kept your existing $STATE_DIR/$conf.conf"
  else
    install -m 600 "$HERE/$conf.conf" "$STATE_DIR/$conf.conf"
  fi
done

if [ ! -f "$STATE_DIR/github_deploy_key" ]; then
  ssh-keygen -q -t ed25519 -N '' -C "nova-backup@$(hostname)" -f "$STATE_DIR/github_deploy_key"
fi
echo
echo "GitHub deploy key (public half - safe to share):"
cat "$STATE_DIR/github_deploy_key.pub"
echo
echo "Installed in $STATE_DIR. Next steps are in docs/backups.md."
