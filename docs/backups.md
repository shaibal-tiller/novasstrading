# Weekly backups

Status: **staging only** (built and tested 2026-10-04). Production uses the same scripts with
`ops/backup/production.conf.example`, only after the production cutover and on the owner's word.

## What happens every Sunday 02:30 (server time)

1. `~/.nova-backup/nova-backup.sh` dumps the staging database (website editor + Assets tables) and
   archives the uploaded media. The database login is read from the API's own `.env.php`; the backup
   keeps no password of its own.
2. Everything goes into one archive encrypted with **age** to the owner's public key. Only the public
   half is on the server: someone who gets hold of the server or the backup files still cannot read
   them.
3. The encrypted archive is uploaded to **Google Drive** (`NovaSS-Backups/staging/weekly`). The first
   backup of each month is also kept in `.../monthly`. The 12 newest weekly and 6 newest monthly
   copies are kept; older ones go to the Drive trash.
4. A smaller archive with just the database is committed to the private GitHub repo
   `novasstrading/novass-backups` (the newest 12 stay in the folder; older ones remain in git history).
5. Temporary files are deleted. The run is silent when it works. If it fails, or a folder is missing,
   it emails `it-support@novasstrading.com`. Details: `~/.nova-backup/staging.log`; last good
   run: `~/.nova-backup/staging.last`.

It runs before the 03:00 media cleanup, so anything the cleanup removes is in that week's backup.
Webmail and `public_html` are not part of it, and nothing in them is touched.

## The backup key (most important part)

- Private key: `~/novass-backup-age-key.txt` on the Mac where it was created. **Copy its whole content
  into your password manager, then keep a second copy offline** (e.g. a USB stick in the office).
  Without it no backup can ever be opened.
- Public key (in the configs; safe to share): `age14359yxnh8ckzs2zfur3dyyjerc9gt4ppxrqay9ln0g2txcw8jqzsv7q8ed`
- Mac tools for restoring: `~/novass-tools/age`, `~/novass-tools/rclone`.

## One-time setup on the server (cPanel -> Terminal)

1. Get the scripts and install the tools (age + rclone, pinned versions, checksum-verified):
   ```
   cd ~/novass-src && git pull && git sparse-checkout add ops && bash ops/backup/install.sh
   ```
   (The server's clone only downloads chosen folders; `sparse-checkout add ops` is what brings in `ops/backup`.)
   It prints a **GitHub deploy key** (one line starting with `ssh-ed25519`).
2. **GitHub**: create a private repo `novasstrading/novass-backups` (tick "Add a README"). Then go to
   Settings -> Deploy keys -> Add deploy key, paste the line, and tick **Allow write access**. On the server:
   ```
   GIT_SSH_COMMAND="ssh -i ~/.nova-backup/github_deploy_key -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new" \
     git clone ssh://git@ssh.github.com:443/novasstrading/novass-backups.git ~/.nova-backup/git
   git -C ~/.nova-backup/git config user.name "Nova SS backup"
   git -C ~/.nova-backup/git config user.email it-support@novasstrading.com
   ```
3. **Google Drive**: on the Mac, run `~/novass-tools/rclone authorize "drive" "eyJzY29wZSI6ImRyaXZlLmZpbGUifQ"`.
   A browser opens: sign in with the Google account that should own the backups and approve. The
   access is limited to files rclone itself creates (`drive.file`). The command prints a long code between
   `--->` and `<---End paste`: decode it (base64) to get the token JSON. On the server write the remote
   straight into rclone's config (`rclone config create` tries to open its own browser sign-in and hangs):
   ```
   mkdir -p ~/.config/rclone && (umask 077; printf '[gdrive]\ntype = drive\nscope = drive.file\ntoken = %s\n' '<token JSON>' > ~/.config/rclone/rclone.conf)
   ~/.nova-backup/bin/rclone about gdrive:
   ```
   The token is a secret: do not paste it anywhere else. rclone's shared Google client is being retired during
   2026; before it stops, create our own OAuth client (same Google Cloud project as analytics) and re-run this step.
4. Test run, then check the result:
   ```
   ~/.nova-backup/nova-backup.sh ~/.nova-backup/staging.conf && cat ~/.nova-backup/staging.last
   ```
5. Schedule it weekly (this keeps the other jobs; check afterwards that the cleanup job is still listed, because
   the staging cleanup entry went missing once):
   ```
   (crontab -l; echo '30 2 * * 0 $HOME/.nova-backup/nova-backup.sh $HOME/.nova-backup/staging.conf >> $HOME/.nova-backup/cron.out 2>&1') | crontab -
   crontab -l
   ```

To update the scripts later: `cd ~/novass-src && git pull && bash ops/backup/install.sh`. Your
edited `~/.nova-backup/staging.conf` is kept.

## Restoring

Every few months, and after any change, run the **restore check** on the Mac. It needs Docker running,
puts nothing into any real database, and ends with `RESTORE CHECK PASSED`:

```
~/novass-tools/rclone copy gdrive:NovaSS-Backups/staging/weekly ./restore --max-age 8d
PATH=~/novass-tools:$PATH bash ops/backup/restore-check.sh ./restore/<file>.tar.age ~/novass-backup-age-key.txt
```

The check decrypts the archive, verifies each file's SHA-256, loads the database into a throwaway
MariaDB 10.6 and compares every table's row count with the counts recorded at backup time.

Real restore, if needed: add `--extract-to ./restored` to get `db-<name>.sql.gz` and
`files.tar.gz`. Load the dump into the target database with phpMyAdmin (Import) or
`gunzip -c db-*.sql.gz | mysql <db>`. Unpack the files with `tar -xzf files.tar.gz -C /` (the paths are
stored in full). Delete the decrypted copy afterwards.

## Production (later)

Copy `ops/backup/production.conf.example` to `~/.nova-backup/production.conf`, then:
- Fill in the production API folder.
- Create a **read-only** MySQL user for the Assets database (`assets-readonly.cnf`).
- Add a second cron line with `production.conf`.

The same key, Drive account and GitHub repo are used (in a `production/` folder).
