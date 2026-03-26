import express from "express";
import { google } from "googleapis";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import cron from "node-cron";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_FILE = path.join(__dirname, "..", "yt-cache.json");

const router = express.Router();
const youtube = google.youtube("v3");

// ── Cache persistant sur disque ──────────────────────────────────────────────
function loadCache() {
  try {
    return JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
  } catch {
    return {
      short: { data: null, fetchedAt: 0 },
      long:  { data: null, fetchedAt: 0 },
      subs:  { data: null, fetchedAt: 0 },
    };
  }
}

function saveCache(cache) {
  try { fs.writeFileSync(CACHE_FILE, JSON.stringify(cache)); } catch {}
}

const cache = loadCache();

// ── Parse ISO 8601 duration ──────────────────────────────────────────────────
function parseDuration(iso) {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (parseInt(m[1] || 0) * 3600) + (parseInt(m[2] || 0) * 60) + parseInt(m[3] || 0);
}

// ── Fetchers (appelés uniquement par le cron, jamais par les routes) ─────────
async function fetchShorts() {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const channelId = process.env.YOUTUBE_CHANNEL_ID;
  if (!apiKey || !channelId) return;

  try {
    console.log("[YT-CRON] Fetching shorts...");
    const searchRes = await youtube.search.list({
      key: apiKey, channelId, part: "snippet", order: "date",
      type: "video", videoDuration: "short", maxResults: 25,
    });

    const items = searchRes.data.items || [];
    const videoIds = items.map((i) => i.id.videoId).filter(Boolean).join(",");
    if (!videoIds) return;

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
      console.log(`[YT-CRON] Shorts updated: ${shorts.length} items`);
    }
  } catch (err) {
    console.error("[YT-CRON] Shorts fetch failed:", err.message || err);
  }
}

async function fetchVideos() {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const channelId = process.env.YOUTUBE_CHANNEL_ID;
  if (!apiKey || !channelId) return;

  try {
    console.log("[YT-CRON] Fetching long videos...");
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
      console.log(`[YT-CRON] Videos updated: ${videos.length} items`);
    }
  } catch (err) {
    console.error("[YT-CRON] Videos fetch failed:", err.message || err);
  }
}

const YT_HANDLES = [
  { key: "lasweety_yt_main",   handle: "La.Sweety" },
  { key: "lasweety_yt_second", handle: "lasweettv" },
  { key: "diolinda_yt",        handle: "Diolindaa_" },
  { key: "lilow_yt",           handle: "Lilowtresor" },
];

async function fetchSubscribers() {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return;

  try {
    console.log("[YT-CRON] Fetching subscribers...");
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
    console.log("[YT-CRON] Subscribers updated");
  } catch (err) {
    console.error("[YT-CRON] Subscribers fetch failed:", err.message || err);
  }
}

// ── Crons ────────────────────────────────────────────────────────────────────
// Shorts  : toutes les 6h (00h, 06h, 12h, 18h)
cron.schedule("0 0,6,12,18 * * *", fetchShorts);

// Vidéos  : mercredi 14h10 + dimanche 14h10 (jours de sortie)
cron.schedule("10 14 * * 3", fetchVideos); // mercredi
cron.schedule("10 14 * * 0", fetchVideos); // dimanche

// Abonnés : chaque jour à 8h
cron.schedule("0 8 * * *", fetchSubscribers);

// ── Initialisation au démarrage si cache vide ────────────────────────────────
// Exécuté une seule fois au boot pour peupler le cache si yt-cache.json est vide
(async () => {
  const missing = [];
  if (!cache.short.data) missing.push(fetchShorts());
  if (!cache.long.data)  missing.push(fetchVideos());
  if (!cache.subs.data)  missing.push(fetchSubscribers());
  if (missing.length) await Promise.all(missing);
})();

// ── Routes : servent uniquement le cache ─────────────────────────────────────
router.get("/videos", (req, res) => {
  if (!cache.long.data) return res.status(503).json({ error: "Videos not yet available" });
  res.json(cache.long.data);
});

router.get("/shorts", (req, res) => {
  if (!cache.short.data) return res.status(503).json({ error: "Shorts not yet available" });
  res.json(cache.short.data);
});

router.get("/subscribers", (req, res) => {
  if (!cache.subs.data) return res.status(503).json({ error: "Subscribers not yet available" });
  res.json(cache.subs.data);
});

export default router;
