import { randomBytes, timingSafeEqual } from "node:crypto";
import express from "express";
import { mf2 } from "microformats-parser";
import { getPostText } from "@indiekit/syndicator-bluesky/lib/utils.js";
import { createStatus } from "@indiekit/syndicator-mastodon/lib/utils.js";

export const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
export function postUrl(value, me) {
  if (typeof value !== "string") throw new Error("Choose a post URL.");
  const url = new URL(value, me);
  if (url.origin !== new URL(me).origin || !/^\/\d{4}\/\d{2}\/\d{2}\/[^/]+\/?$/.test(url.pathname) || url.search || url.hash) throw new Error("Choose a post on this site.");
  url.pathname = url.pathname.replace(/\/$/, "") + "/";
  return url.href;
}
export async function publicPost(url, fetcher = fetch) {
  const response = await fetcher(url, { redirect: "error", headers: { "Cache-Control": "no-cache" }, signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error("Could not load the published post.");
  const entry = mf2(await response.text(), { baseUrl: url }).items.find(item => item.type.includes("h-entry"));
  if (!entry?.properties.content?.length) throw new Error("No published post found at this URL.");
  const p = entry.properties;
  const content = p.content[0];
  return {
    url, content: typeof content === "string" ? { text: content, html: escapeHtml(content) } : content,
    ...(p.name?.[0] && p.name[0] !== (typeof content === "string" ? content : content.value) && { name: p.name[0] }),
    syndication: p.syndication || [],
    photo: (p.photo || []).map(photo => typeof photo === "string" ? { url: photo, alt: "" } : { url: photo.value, alt: photo.alt || "" }),
    ...(p["in-reply-to"]?.[0] && { "in-reply-to": p["in-reply-to"][0] }),
  };
}
export function existingLinks(properties, target, receipts = []) {
  const origin = new URL(target.info.uid).origin;
  return [...new Set([...(properties.syndication || []), ...receipts.map(r => r.url)].filter(url => {
    try { return new URL(url).origin === origin && new URL(url).protocol === "https:"; } catch { return false; }
  }))];
}
export function draftProperties(properties, text) {
  const { name, summary, category, ...rest } = properties;
  return { ...rest, content: { text, html: escapeHtml(text).replace(/\n/g, "<br>") } };
}
const tokenValid = (actual, expected) => typeof actual === "string" && typeof expected === "string" && Buffer.byteLength(actual) === Buffer.byteLength(expected) && timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
const canSend = req => {
  const scope = (req.session?.scope || "").split(/\s+/);
  return scope.includes("update") && !scope.includes("draft");
};
export function renderEditor({ url, properties, targets, receipts, csrf, values = {}, message = "" }) {
  const e = escapeHtml;
  const cards = targets.map(target => {
    const name = target.info.service.name;
    const key = name.toLowerCase();
    const links = existingLinks(properties, target, receipts);
    const receipt = receipts.find(r => r.target === target.info.uid);
    const pending = properties["mp-syndicate-to"];
    const blocked = receipt && !receipt.url || (Array.isArray(pending) ? pending.length > 0 : !!pending);
    const initial = key === "bluesky" ? getPostText(properties, false, false) : createStatus(properties, { characterLimit: target.options.characterLimit || 500, serverUrl: target.options.url }).status || "";
    const text = values[key] ?? initial;
    const limit = key === "bluesky" ? 300 : target.options.characterLimit || 500;
    return `<section><h2>${e(name)}</h2>${links.length ? links.map(link => `<p>Already syndicated: <a href="${e(link)}" target="_blank" rel="noopener noreferrer">View post ↗</a></p>`).join("") : blocked ? `<p>Sending is blocked: ${receipt ? "a previous send needs review. Check your social account; the request may have succeeded." : "this post is queued for automatic syndication. Wait for it to finish, then reload."}</p>` : `<label><input type="checkbox" name="targets" value="${key}" ${values.targets?.includes(key) ? "checked" : ""}> Send to ${e(name)}</label><p><label for="${key}">Draft · maximum ${limit} characters</label></p><textarea id="${key}" name="${key}" rows="8">${e(text)}</textarea><p>${properties.photo?.length || 0} photo(s) attached from the original post. ${properties["in-reply-to"] ? "Original reply context is preserved." : ""}</p>`}</section>`;
  }).join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Syndicate post</title><style>body{font:17px/1.5 system-ui,sans-serif;max-width:760px;margin:3rem auto;padding:0 1rem;color:#222;background:#faf9f6}a{color:#275d97}section{padding:1.2rem;border:1px solid #ccc;border-radius:8px;margin:1.5rem 0;background:white}h2{margin-top:0}textarea{box-sizing:border-box;width:100%;font:inherit;padding:.7rem}button{font:inherit;padding:.7rem 1.2rem;cursor:pointer}input{width:1.1rem;height:1.1rem}aside{padding:1rem;border:1px solid #888}small{color:#555}</style></head><body><nav><a href="/">Kit</a> · <a href="${e(url)}">View original post ↗</a></nav><h1>Syndicate post</h1><p>${e(properties.name || url)}</p><small>Checks saved syndication links and previous sends. Posts made independently on social networks may not be recorded here. Draft edits only affect the social posts. Photos and reply context are retained; video and audio uploads are not supported here.</small>${message ? `<aside role="status">${e(message)}</aside>` : ""}<form method="post"><input type="hidden" name="url" value="${e(url)}"><input type="hidden" name="csrf" value="${e(csrf)}">${cards}<button type="submit">Send selected posts</button></form></body></html>`;
}
export default class SyndicationEditor {
  name = "Syndication editor";
  mountPath = "/syndication";
  init(indiekit) {
    indiekit.addCollection("syndicationReceipts");
    indiekit.addEndpoint(this);
  }
  get routes() {
    const router = express.Router();
    router.use((req, res, next) => {
      res.set("Cache-Control", "no-store");
      if (!canSend(req)) return res.status(403).send("Sign in with update permission to syndicate posts.");
      req.session.syndicationCsrf ||= randomBytes(32).toString("hex");
      next();
    });
    const handle = async (req, res, next) => {
      try {
        const { application, publication } = req.app.locals;
        const url = postUrl(req.method === "POST" ? req.body.url : req.query.url, publication.me);
        const posts = application.collections?.get("posts");
        const ledger = application.collections?.get("syndicationReceipts");
        if (!posts || !ledger) return res.status(503).send("Syndication requires the post database.");
        const record = await posts.findOne({ "properties.url": { $in: [url, url.replace(/\/$/, "")] } });
        const properties = record?.properties || await publicPost(url);
        if (properties.deleted || properties["post-status"] === "draft" || properties.visibility && properties.visibility !== "public") return res.status(409).send("Only published public posts can be syndicated.");
        if (properties["like-of"] || properties["repost-of"]) return res.status(409).send("Use the existing like/repost workflow for this post type.");
        const targets = publication.syndicationTargets.filter(t => ["Bluesky", "Mastodon"].includes(t.info.service.name));
        let receipts = await ledger.find({ source: url }).toArray();
        let message = "";
        let status = 200;
        const values = req.method === "POST" ? req.body : {};
        if (req.method === "POST") {
          if (!tokenValid(req.body.csrf, req.session.syndicationCsrf)) return res.status(403).send("This form expired. Reload and try again.");
          const selected = typeof req.body.targets === "string" ? [req.body.targets] : req.body.targets;
          const chosen = Array.isArray(selected) ? targets.filter(t => selected.includes(t.info.service.name.toLowerCase())) : [];
          values.targets = Array.isArray(selected) ? selected : [];
          if (!chosen.length || selected.some(k => !targets.some(t => t.info.service.name.toLowerCase() === k))) {
            status = 422; message = "Select Bluesky, Mastodon, or both.";
          } else if (properties["mp-syndicate-to"]?.length) {
            status = 409; message = "This post is queued for automatic syndication. Reload after it finishes.";
          } else {
            for (const target of chosen) {
              if (existingLinks(properties, target, receipts).length) continue;
              const key = target.info.service.name.toLowerCase();
              const text = req.body[key];
              const limit = key === "bluesky" ? 300 : target.options.characterLimit || 500;
              const count = typeof text === "string" ? [...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text)].length : 0;
              if (!count || !text.trim() || count > limit) { status = 422; message = `The ${target.info.service.name} draft must contain 1–${limit} characters.`; break; }
            }
            if (status === 200) {
              const results = [];
              for (const target of chosen) {
                const key = target.info.service.name.toLowerCase();
                if (existingLinks(properties, target, receipts).length) { results.push(`${target.info.service.name} already syndicated.`); continue; }
                const id = `${url}|${target.info.uid}`;
                // Unique _id reserves the send across tabs and restarts before calling the social API.
                try { await ledger.insertOne({ _id: id, source: url, target: target.info.uid, state: "sending", created: new Date() }); }
                catch (error) { if (error.code !== 11000) throw error; results.push(`${target.info.service.name}: previous send needs review; no duplicate sent.`); continue; }
                try {
                  const sentUrl = await target.syndicate(draftProperties(properties, req.body[key]), publication);
                  if (!sentUrl) throw new Error("No post URL returned");
                  await ledger.updateOne({ _id: id }, { $set: { url: sentUrl, state: "sent" } });
                  receipts.push({ target: target.info.uid, url: sentUrl });
                  let synced = true;
                  if (record) {
                    try {
                      const saved = await fetch(application.micropubEndpoint, {
                        method: "POST", signal: AbortSignal.timeout(15000),
                        headers: { "Content-Type": "application/json", Authorization: `Bearer ${req.session.access_token}` },
                        body: JSON.stringify({ action: "update", url: properties.url, add: { syndication: [sentUrl] } }),
                      });
                      synced = saved.ok;
                    } catch { synced = false; }
                  }
                  results.push(`${target.info.service.name} sent.${synced ? "" : " Link saved here; syncing the link to the original post failed."}`);
                } catch {
                  await ledger.updateOne({ _id: id }, { $set: { state: "review" } });
                  results.push(`${target.info.service.name}: send could not be confirmed. Check the social account before retrying.`);
                }
              }
              message = results.join(" ");
              receipts = await ledger.find({ source: url }).toArray();
            }
          }
        }
        res.status(status).type("html").send(renderEditor({ url, properties, targets, receipts, csrf: req.session.syndicationCsrf, values, message }));
      } catch (error) { next(error); }
    };
    router.get("/", handle);
    router.post("/", handle);
    return router;
  }
}
