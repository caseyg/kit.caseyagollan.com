import process from "node:process";
import * as dotenv from "dotenv";

dotenv.config();

const config = {
  application: {
    timeZone: "America/New_York",
  },
  plugins: [
    "@indiekit/preset-eleventy",
    "@indiekit/store-github",
    "@indiekit/store-s3",
    "@indiekit/syndicator-mastodon",
    "@indiekit/syndicator-bluesky",
    "@indiekit/endpoint-webmention-io",
  ],
  publication: {
    me: "https://caseyagollan.com",
    store: "@indiekit/store-github",
    mediaStore: "@indiekit/store-s3",
    postTypes: {
      note: {
        name: "Note",
        post: {
          path: "notes/{yyyy}-{MM}-{dd}-{slug}.md",
          url: "{yyyy}/{MM}/{dd}/{slug}",
        },
      },
      bookmark: {
        name: "Bookmark",
        post: {
          path: "bookmarks/{yyyy}-{MM}-{dd}-{slug}.md",
          url: "{yyyy}/{MM}/{dd}/{slug}",
        },
      },
      article: {
        name: "Article",
        post: {
          path: "articles/{yyyy}-{MM}-{dd}-{slug}.md",
          url: "{yyyy}/{MM}/{dd}/{slug}",
        },
      },
      photo: {
        name: "Photo",
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
        name: "Reply",
        post: {
          path: "replies/{yyyy}-{MM}-{dd}-{slug}.md",
          url: "{yyyy}/{MM}/{dd}/{slug}",
        },
      },
      repost: {
        name: "Repost",
        post: {
          path: "reposts/{yyyy}-{MM}-{dd}-{slug}.md",
          url: "{yyyy}/{MM}/{dd}/{slug}",
        },
      },
      like: {
        name: "Like",
        post: {
          path: "likes/{yyyy}-{MM}-{dd}-{slug}.md",
          url: "{yyyy}/{MM}/{dd}/{slug}",
        },
      },
      event: {
        name: "Event",
        post: {
          path: "events/{yyyy}-{MM}-{dd}-{slug}.md",
          url: "{yyyy}/{MM}/{dd}/{slug}",
        },
      },
      rsvp: {
        name: "RSVP",
        post: {
          path: "rsvps/{yyyy}-{MM}-{dd}-{slug}.md",
          url: "{yyyy}/{MM}/{dd}/{slug}",
        },
      },
      audio: {
        name: "Audio",
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
        name: "Video",
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
        name: "Jam",
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
};

export default config;
