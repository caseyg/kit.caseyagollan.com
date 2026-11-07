import process from "node:process";
import { fileURLToPath } from "node:url";
import * as dotenv from "dotenv";

dotenv.config();

const config = {
  application: {
    timeZone: "America/New_York",
    port: Number(process.env.PORT || 3000),
  },
  plugins: [
    "@indiekit/post-type-article",
    "@indiekit/post-type-audio",
    "@indiekit/post-type-bookmark",
    "@indiekit/post-type-event",
    "@indiekit/post-type-jam",
    "@indiekit/post-type-like",
    "@indiekit/post-type-note",
    "@indiekit/post-type-photo",
    "@indiekit/post-type-reply",
    "@indiekit/post-type-repost",
    "@indiekit/post-type-rsvp",
    "@indiekit/post-type-video",
    "@indiekit/preset-eleventy",
    "@indiekit/store-github",
    "@indiekit/store-s3",
    "@indiekit/syndicator-mastodon",
    "@indiekit/syndicator-bluesky",
    "@indiekit/endpoint-webmention-io",
    fileURLToPath(new URL("./plugins/syndication/index.js", import.meta.url)),
  ],
  publication: {
    me: "https://caseyagollan.com",
    store: "@indiekit/store-github",
    mediaStore: "@indiekit/store-s3",
    postTypes: {
      note: {
        post: {
          path: "notes/{yyyy}-{MM}-{dd}-{slug}.md",
          url: "{yyyy}/{MM}/{dd}/{slug}",
        },
      },
      bookmark: {
        post: {
          path: "bookmarks/{yyyy}-{MM}-{dd}-{slug}.md",
          url: "{yyyy}/{MM}/{dd}/{slug}",
        },
      },
      article: {
        post: {
          path: "articles/{yyyy}-{MM}-{dd}-{slug}.md",
          url: "{yyyy}/{MM}/{dd}/{slug}",
        },
      },
      photo: {
        post: {
          path: "photos/{yyyy}-{MM}-{dd}-{slug}.md",
          url: "{yyyy}/{MM}/{dd}/{slug}",
        },
        media: {
          path: "media/photos/{yyyy}/{MM}/{dd}/{filename}",
          url: "https://files.caseyagollan.com/media/photos/{yyyy}/{MM}/{dd}/{filename}",
        },
      },
      reply: {
        post: {
          path: "replies/{yyyy}-{MM}-{dd}-{slug}.md",
          url: "{yyyy}/{MM}/{dd}/{slug}",
        },
      },
      repost: {
        post: {
          path: "reposts/{yyyy}-{MM}-{dd}-{slug}.md",
          url: "{yyyy}/{MM}/{dd}/{slug}",
        },
      },
      like: {
        post: {
          path: "likes/{yyyy}-{MM}-{dd}-{slug}.md",
          url: "{yyyy}/{MM}/{dd}/{slug}",
        },
      },
      event: {
        post: {
          path: "events/{yyyy}-{MM}-{dd}-{slug}.md",
          url: "{yyyy}/{MM}/{dd}/{slug}",
        },
      },
      rsvp: {
        post: {
          path: "rsvps/{yyyy}-{MM}-{dd}-{slug}.md",
          url: "{yyyy}/{MM}/{dd}/{slug}",
        },
      },
      audio: {
        post: {
          path: "audio/{yyyy}-{MM}-{dd}-{slug}.md",
          url: "{yyyy}/{MM}/{dd}/{slug}",
        },
        media: {
          path: "media/audio/{yyyy}/{MM}/{dd}/{filename}",
          url: "https://files.caseyagollan.com/media/audio/{yyyy}/{MM}/{dd}/{filename}",
        },
      },
      video: {
        post: {
          path: "videos/{yyyy}-{MM}-{dd}-{slug}.md",
          url: "{yyyy}/{MM}/{dd}/{slug}",
        },
        media: {
          path: "media/videos/{yyyy}/{MM}/{dd}/{filename}",
          url: "https://files.caseyagollan.com/media/videos/{yyyy}/{MM}/{dd}/{filename}",
        },
      },
      jam: {
        post: {
          path: "jams/{yyyy}-{MM}-{dd}-{slug}.md",
          url: "{yyyy}/{MM}/{dd}/{slug}",
        },
      },
    },
  },
  "@indiekit/store-github": {
    user: "caseyg",
    repo: "caseyagollan-content",
    branch: "main",
  },
  "@indiekit/store-s3": {
    region: "auto",
    endpoint: "https://78689551a1a65e36adcd6f3d72a3cacb.r2.cloudflarestorage.com",
    bucket: "caseyagollan-content",
  },
  "@indiekit/syndicator-mastodon": {
    url: "https://social.coop",
    user: "caseyg",
    includePermalink: false,
  },
  "@indiekit/syndicator-bluesky": {
    handle: "caseyagollan.com",
    checked: false,
    includePermalink: false,
  },
  "@indiekit/endpoint-webmention-io": {
    mountPath: "/webmentions",
  },
  "@indiekit/post-type-article": {
    fields: {
      name: { required: true },
      content: { required: true },
      summary: {},
      category: {},
      "post-status": {},
      published: { required: true },
      visibility: {},
    },
  },
  "@indiekit/post-type-note": {
    fields: {
      content: { required: true },
      category: {},
      "post-status": {},
      published: { required: true },
      visibility: {},
    },
  },
  "@indiekit/post-type-photo": {
    fields: {
      photo: { required: true },
      content: {},
      category: {},
      "post-status": {},
      "mp-photo-alt": { required: true },
      published: { required: true },
      visibility: {},
    },
  },
  "@indiekit/post-type-video": {
    fields: {
      video: { required: true },
      content: {},
      category: {},
      "post-status": {},
      published: { required: true },
      visibility: {},
    },
  },
  "@indiekit/post-type-audio": {
    fields: {
      audio: { required: true },
      content: {},
      category: {},
      "post-status": {},
      published: { required: true },
      visibility: {},
    },
  },
  "@indiekit/post-type-bookmark": {
    fields: {
      "bookmark-of": { required: true },
      name: {},
      content: {},
      category: {},
      "post-status": {},
      published: { required: true },
      visibility: {},
    },
  },
  "@indiekit/post-type-reply": {
    fields: {
      "in-reply-to": { required: true },
      content: { required: true },
      category: {},
      "post-status": {},
      published: { required: true },
      visibility: {},
    },
  },
  "@indiekit/post-type-repost": {
    fields: {
      "repost-of": { required: true },
      content: {},
      category: {},
      "post-status": {},
      published: { required: true },
      visibility: {},
    },
  },
  "@indiekit/post-type-like": {
    fields: {
      "like-of": { required: true },
      category: {},
      "post-status": {},
      published: { required: true },
      visibility: {},
    },
  },
  "@indiekit/post-type-event": {
    fields: {
      name: { required: true },
      start: { required: true },
      end: {},
      location: {},
      content: {},
      category: {},
      "post-status": {},
      published: { required: true },
      visibility: {},
    },
  },
  "@indiekit/post-type-rsvp": {
    fields: {
      "in-reply-to": { required: true },
      rsvp: { required: true },
      content: {},
      category: {},
      "post-status": {},
      published: { required: true },
      visibility: {},
    },
  },
  "@indiekit/post-type-jam": {
    fields: {
      name: { required: true },
      content: {},
      category: {},
      "post-status": {},
      published: { required: true },
      visibility: {},
    },
  },
};

export default config;
