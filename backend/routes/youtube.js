import express from "express";
import { google } from "googleapis";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_FILE = path.join(__dirname, "..", "yt-cache.json");
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 heures

const router = express.Router();
const youtube = google.youtube("v3");

// ── Cache persistant sur disque ──────────────────────────────────────────────
function loadCache() {
  try {
    return JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
  } catch {
    return { short: { data: null, fetchedAt: 0 }, long: { data: null, fetchedAt: 0 }, subs: { data: null, fetchedAt: 0 } };
  }
}

function saveCache(cache) {
  try { fs.writeFileSync(CACHE_FILE, JSON.stringify(cache)); } catch {}
}

const cache = loadCache();

// ── Verrous anti-stampede ────────────────────────────────────────────────────
const inflight = { short: null, long: null, subs: null };

// ── Videos ──────────────────────────────────────────────────────────────────
router.get("/videos", async (req, res) => {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    const channelId = process.env.YOUTUBE_CHANNEL_ID;
    if (!apiKey || !channelId) return res.status(500).json({ error: "YouTube not configured" });

    const now = Date.now();
    if (cache.long.data && now - cache.long.fetchedAt < CACHE_TTL_MS) {
      return res.json(cache.long.data);
    }

    // Si une requête est déjà en cours, attendre son résultat
    if (inflight.long) return res.json(await inflight.long);

    inflight.long = (async () => {
      const [medRes, longRes] = await Promise.all([
        youtube.search.list({ key: apiKey, channelId, part: "snippet", order: "date", type: "video", videoDuration: "medium", maxResults: 10 }),
        youtube.search.list({ key: apiKey, channelId, part: "snippet", order: "date", type: "video", videoDuration: "long",   maxResults: 10 }),
      ]);

      const videos = [
        ...(medRes.data.items || []),
        ...(longRes.data.items || []),
      ]
        .sort((a, b) => new Date(b.snippet.publishedAt) - new Date(a.snippet.publishedAt))
        .slice(0, 10)
        .map((item) => ({
          id: item.id.videoId,
          title: item.snippet.title,
          thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
          publishedAt: item.snippet.publishedAt,
          url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        }));

      if (videos.length > 0) {
        cache.long = { data: videos, fetchedAt: Date.now() };
        saveCache(cache);
      }
      return videos;
    })().finally(() => { inflight.long = null; });

    res.json(await inflight.long);
  } catch (err) {
    console.error("[YT] Error fetching videos:", err.message || err);
    if (cache.long.data) return res.json(cache.long.data); // fallback cache expiré
    res.status(500).json({ error: "Failed to fetch YouTube videos" });
  }
});

// ── Parse ISO 8601 duration ──────────────────────────────────────────────────
function parseDuration(iso) {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (parseInt(m[1] || 0) * 3600) + (parseInt(m[2] || 0) * 60) + parseInt(m[3] || 0);
}

// ── Shorts ───────────────────────────────────────────────────────────────────
router.get("/shorts", async (req, res) => {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    const channelId = process.env.YOUTUBE_CHANNEL_ID;
    if (!apiKey || !channelId) return res.status(500).json({ error: "YouTube not configured" });

    const now = Date.now();
    if (cache.short.data && now - cache.short.fetchedAt < CACHE_TTL_MS) {
      return res.json(cache.short.data);
    }

    if (inflight.short) return res.json(await inflight.short);

    inflight.short = (async () => {
      const searchRes = await youtube.search.list({
        key: apiKey, channelId, part: "snippet", order: "date",
        type: "video", videoDuration: "short", maxResults: 25,
      });

      const items = searchRes.data.items || [];
      const videoIds = items.map((i) => i.id.videoId).filter(Boolean).join(",");
      if (!videoIds) return [];

      const detailsRes = await youtube.videos.list({
        key: apiKey, id: videoIds, part: "contentDetails,snippet",
      });

      const shorts = (detailsRes.data.items || [])
        .filter((v) => parseDuration(v.contentDetails.duration) < 240)
        .slice(0, 20)
        .map((v) => ({
          id: v.id,
          title: v.snippet.title,
          thumbnail: v.snippet.thumbnails?.high?.url || v.snippet.thumbnails?.default?.url,
          publishedAt: v.snippet.publishedAt,
          url: `https://www.youtube.com/shorts/${v.id}`,
        }));

      if (shorts.length > 0) {
        cache.short = { data: shorts, fetchedAt: Date.now() };
        saveCache(cache);
      }
      return shorts;
    })().finally(() => { inflight.short = null; });

    res.json(await inflight.short);
  } catch (err) {
    console.error("[YT] Error fetching shorts:", err.message || err);
    if (cache.short.data) return res.json(cache.short.data); // fallback cache expiré
    res.status(500).json({ error: "Failed to fetch YouTube shorts" });
  }
});

// ── Abonnés ──────────────────────────────────────────────────────────────────
const SUBS_TTL = 24 * 60 * 60 * 1000; // 24h pour les abonnés

const YT_HANDLES = [
  { key: "lasweety_yt_main",   handle: "La.Sweety" },
  { key: "lasweety_yt_second", handle: "lasweettv" },
  { key: "diolinda_yt",        handle: "Diolindaa_" },
  { key: "lilow_yt",           handle: "Lilowtresor" },
];

router.get("/subscribers", async (req, res) => {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "YouTube not configured" });

    const now = Date.now();
    if (cache.subs.data && now - cache.subs.fetchedAt < SUBS_TTL) {
      return res.json(cache.subs.data);
    }

    if (inflight.subs) return res.json(await inflight.subs);

    inflight.subs = (async () => {
      const results = await Promise.all(
        YT_HANDLES.map(({ key, handle }) =>
          youtube.channels
            .list({ key: apiKey, part: ["statistics"], forHandle: handle })
            .then((r) => {
              const count = r.data.items?.[0]?.statistics?.subscriberCount;
              return { key, handle: `@${handle}`, subscribers: count ? parseInt(count) : null };
            })
            .catch(() => ({ key, handle: `@${handle}`, subscribers: null }))
        )
      );
      cache.subs = { data: results, fetchedAt: Date.now() };
      saveCache(cache);
      return results;
    })().finally(() => { inflight.subs = null; });

    res.json(await inflight.subs);
  } catch (err) {
    console.error("[YT] Error fetching subscribers:", err.message || err);
    if (cache.subs.data) return res.json(cache.subs.data);
    res.status(500).json({ error: "Failed to fetch subscribers" });
  }
});

export default router;
