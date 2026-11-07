import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import Editor, { postUrl, existingLinks, draftProperties, publicPost } from './index.js';

const url = 'https://caseyagollan.com/2026/05/06/522cc/';
const makeTarget = name => ({ info: { uid: name === 'Bluesky' ? 'https://bsky.app/profile/caseyagollan.com' : 'https://social.coop/@caseyg', service: { name } }, options: { url: 'https://social.coop', characterLimit: 500 } });
test('canonical URLs reject foreign origins, query strings and non-post paths', () => {
  assert.equal(postUrl(url.slice(0, -1), 'https://caseyagollan.com'), url);
  for (const bad of ['https://evil.example/2026/05/06/a/', '//evil.example/2026/05/06/a/', url + '?x=1', '/library/']) assert.throws(() => postUrl(bad, 'https://caseyagollan.com'));
});
test('links use exact origins and ignore malformed metadata', () => {
  assert.deepEqual(existingLinks({ syndication: ['invalid', 'https://bsky.app.evil/post/x', 'https://bsky.app/profile/a/post/b'] }, makeTarget('Bluesky')), ['https://bsky.app/profile/a/post/b']);
});
test('edited drafts replace title/content while retaining media and reply context', () => {
  const p = { name: 'Title', summary: 'summary', category: ['tag'], photo: [{url: 'photo'}], 'in-reply-to': 'reply' };
  const draft = draftProperties(p, '<hello>\nworld');
  assert.equal(draft.name, undefined);
  assert.equal(draft.content.html, '&lt;hello&gt;<br>world');
  assert.deepEqual(draft.photo, p.photo);
  assert.equal(draft['in-reply-to'], 'reply');
  assert.equal(p.name, 'Title');
});
test('older public pages supply content, photos and syndication links', async () => {
  const p = await publicPost(url, async () => new Response('<article class="h-entry"><div class="e-content"><p>Hello</p></div><img class="u-photo" src="/photo.jpg" alt="Alt"><a class="u-syndication" href="https://bsky.app/profile/a/post/b">B</a></article>'));
  assert.match(p.content.html, /Hello/);
  assert.equal(p.photo[0].url, 'https://caseyagollan.com/photo.jpg');
  assert.deepEqual(p.syndication, ['https://bsky.app/profile/a/post/b']);
});

test('editor validates, isolates failures, persists receipts and prevents duplicate sends', async () => {
  const rows = new Map();
  const sent = [];
  const properties = { url, content: { html: '<p>Original</p>' }, syndication: [] };
  const targets = ['Bluesky', 'Mastodon'].map(name => ({ ...makeTarget(name), syndicate: async p => { sent.push([name, p]); if (name === 'Mastodon') throw Error('ambiguous timeout'); return 'https://bsky.app/profile/a/post/b'; } }));
  const ledger = {
    find: () => ({ toArray: async () => [...rows.values()] }),
    insertOne: async row => { if(rows.has(row._id)) throw Object.assign(Error(), {code:11000}); rows.set(row._id, {...row}); },
    updateOne: async ({_id}, update) => Object.assign(rows.get(_id), update.$set),
  };
  const posts = { findOne: async () => ({properties}) };
  const app = express();
  app.use(express.urlencoded({extended:true}));
  let scope = 'update';
  app.use((req,res,next) => { req.session = { scope, access_token:'fake', syndicationCsrf:'test-csrf' }; next(); });
  app.locals.application = { collections: new Map([['posts',posts], ['syndicationReceipts',ledger]]), micropubEndpoint: 'http://127.0.0.1:1/unavailable' };
  app.locals.publication = { me: 'https://caseyagollan.com', syndicationTargets: targets };
  app.use('/syndication', new Editor().routes);
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening',resolve));
  const endpoint = `http://127.0.0.1:${server.address().port}/syndication`;
  const send = fields => fetch(endpoint, {method:'POST', body:new URLSearchParams([['url',url],['csrf','test-csrf'], ...fields])});
  try {
    scope = 'create';
    assert.equal((await fetch(endpoint+'?url='+encodeURIComponent(url))).status,403);
    scope = 'update';
    const html = await (await fetch(endpoint+'?url='+encodeURIComponent(url))).text();
    assert.match(html,/name="targets" value="bluesky"/);
    assert.match(html,/name="targets" value="mastodon"/);
    assert.equal((await send([['csrf','bad'],['targets','bluesky']])).status,403);
    assert.equal((await send([['targets','bluesky'],['bluesky','x'.repeat(301)]])).status,422);
    assert.equal(sent.length,0);
    const form = [['targets','bluesky'],['targets','mastodon'],['bluesky','Edited B'],['mastodon','Edited M']];
    const result = await (await send(form)).text();
    assert.match(result,/View post/);
    assert.match(result,/Check the social account/);
    assert.equal(sent.length,2);
    assert.equal(sent[0][1].content.text,'Edited B');
    await Promise.all([send(form), send(form)]);
    assert.equal(sent.length,2);
    assert.equal([...rows.values()].find(r=>r.url)?.url,'https://bsky.app/profile/a/post/b');
    properties['mp-syndicate-to'] = ['https://social.coop/@caseyg'];
    assert.equal((await send(form)).status,409);
  } finally { server.close(); }
});
