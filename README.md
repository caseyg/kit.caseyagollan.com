# Indiekit server for https://kit.caseyagollan.com

Indiekit beta.31 with GitHub content storage, Cloudflare R2 media storage,
Bluesky/Mastodon syndication, and webmention.io.

## Runtime and installation

Use Node.js 24.22.1 (`nvm use`) and npm. `package-lock.json` is the only
lockfile; Indiekit packages are pinned to their current individual releases.
Run `npm ci`, then `npm start`. The server listens on port 3000 (or `PORT` when set).

For Docker, run `docker build -t indiekit .`. The image installs with `npm ci`
and runs as the unprivileged `node` user.

## Docker Compose

Copy `.env.example` to `.env` and fill in credentials. Compose exposes the app
at `http://localhost:3000` (override with `HTTP_PORT`). It uses the existing
external volume named `mongo`; create it with `docker volume create mongo`
only for a fresh installation. Then run `docker compose up --build -d`.

**Existing MongoDB 4 data:** Do not start MongoDB 8 against the old volume.
Set `MONGO_IMAGE=mongo:4` before using Compose with that volume. Back up first,
verify a restore in an isolated environment, and follow MongoDB's supported
successive-major upgrade procedure, including feature compatibility changes.
The example MongoDB 8 image is for fresh installations or migrated volumes.
Compose requires an explicit `MONGO_IMAGE` to avoid silently upgrading an old volume.
Never use `docker compose down -v` as an upgrade step.

## Production upgrade and rollback

The connected Railway project is `kit`, production environment. As inspected
on 2026-11-04, its MongoDB service already uses `mongo:8.0`; no production
MongoDB major upgrade is needed. All required credential names are configured,
but OAuth does not expose their values or establish that they remain valid.

Before deploying beta.31:

1. Create a manual backup of `MongoDB`'s `mongodb-volume` in Railway and confirm
   it completed. Preserve a recovery point and verify a restore where possible.
2. Record the currently successful app deployment for rollback. The deployment
   observed before this upgrade is `252b7e6a-9653-41e3-9250-032cacbceecc`.
3. Deploy the reviewed application changes. Startup backfills missing UUIDv7
   `properties.uid` values in existing MongoDB records before serving requests;
   monitor startup logs and allow this to complete.
4. Verify login and an existing post, then deliberately create/edit a test post,
   upload media to R2, and verify syndication to both Bluesky and Mastodon.
   These checks create real external content and require valid credentials.
5. If startup or publishing fails, roll back the app to its recorded deployment.
   Restore the pre-upgrade database backup if data recovery is needed; an app
   rollback alone does not undo the UID backfill. Avoid overwriting posts made
   after the backup without reviewing them first.

The connected Railway tools expose service metadata and credential names, but
cannot create volume backups, access the database, or run production shell
commands. A backup must be completed through an authenticated Railway session
before the production rollout when available. On 2026-11-04 the owner reported
that backup creation requires a Pro plan and explicitly authorized this upgrade
without a new backup.

## Known upstream dependency advisories

`npm audit --omit=dev` on 2026-11-04 reports 9 findings (6 high, 3 low),
representing Zod and deepmerge advisories plus their dependent packages.
The current Bluesky dependency chain uses Zod 3; the published fix requires
Zod 4.6.6 or newer. Do not force a major override of that validation library.
The deepmerge advisory affects Indiekit's current release as well. npm's
suggested core downgrade to 0.2.0 is not an appropriate fix. Track upstream
updates and reassess these findings before treating this upgrade as clearing
all dependency advisories.

Learn more at <https://getindiekit.com>.

## Manual syndication editor

Append `/syndicate` to a post permalink on caseyagollan.com. The website redirects
to `/syndication?url=…` on Kit, which uses the existing IndieAuth login and requires
`update` scope. Select Bluesky, Mastodon, or both, edit each destination's text,
and choose **Send selected posts**. Existing saved syndication links appear instead
of a send control. Draft edits do not change the original post.

The local `plugins/syndication` endpoint uses the configured syndicators and MongoDB.
It checks Indiekit post records and its own durable send receipts; for older posts
without records it parses the public page's h-entry, including syndication links.
It does not search social accounts for independently published copies. Photos and
reply context are retained; audio/video uploads and like/repost actions use other
workflows. Posts queued for automatic syndication cannot be sent here until the queue
finishes. Only published public posts can be sent.

A `syndicationReceipts` record reserves each source URL and destination before a
send, preventing repeated submissions across tabs and restarts. Successful URLs are
saved there immediately, then added to the original post through Micropub when an
Indiekit record exists. For legacy pages, the editor keeps the links in receipts.
If a network response is uncertain, sending to that destination stays blocked.
An operator must check the social account and reconcile the receipt (record its URL
if sent, or remove the receipt only after confirming no post was created).

Run `node --test plugins/syndication/index.test.js` for the editor's regression tests.
Deploy both the website redirect and Kit endpoint to enable the complete flow.
