import express from "express";
import { google } from "googleapis";

const router = express.Router();
const youtube = google.youtube("v3");

// Cache séparé par type
const cache = { short: { data: null, fetchedAt: 0 }, long: { data: null, fetchedAt: 0 } };
const CACHE_TTL_MS = 10 * 60 * 1000;

router.get("/videos", async (req, res) => {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    const channelId = process.env.YOUTUBE_CHANNEL_ID;
    if (!apiKey || !channelId) {
      return res.status(500).json({ error: "YouTube not configured" });
    }

    const now = Date.now();
    if (cache.long.data && now - cache.long.fetchedAt < CACHE_TTL_MS) {
      return res.json(cache.long.data);
    }

    // Fetch medium (4-20min) + long (>20min) pour couvrir toutes les vidéos >4min
    const [medRes, longRes] = await Promise.all([
      youtube.search.list({ key: apiKey, channelId, part: "snippet", order: "date", type: "video", videoDuration: "medium", maxResults: 10 }),
      youtube.search.list({ key: apiKey, channelId, part: "snippet", order: "date", type: "video", videoDuration: "long",   maxResults: 10 }),
    ]);

    const allItems = [
      ...(medRes.data.items || []),
      ...(longRes.data.items || []),
    ]
      .sort((a, b) => new Date(b.snippet.publishedAt) - new Date(a.snippet.publishedAt))
      .slice(0, 10);

    const videos = allItems.map((item) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
      publishedAt: item.snippet.publishedAt,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    }));

    cache.long = { data: videos, fetchedAt: now };
    res.json(videos);
  } catch (err) {
    console.error("[YT] Error fetching videos:", err.message || err);
    res.status(500).json({ error: "Failed to fetch YouTube videos" });
  }
});

// Parse ISO 8601 duration (PT1M30S) en secondes
function parseDuration(iso) {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (parseInt(m[1] || 0) * 3600) + (parseInt(m[2] || 0) * 60) + parseInt(m[3] || 0);
}

router.get("/shorts", async (req, res) => {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    const channelId = process.env.YOUTUBE_CHANNEL_ID;
    if (!apiKey || !channelId) {
      return res.status(500).json({ error: "YouTube not configured" });
    }

    const now = Date.now();
    if (cache.short.data && now - cache.short.fetchedAt < CACHE_TTL_MS) {
      return res.json(cache.short.data);
    }

    // Étape 1 : récupère les 50 dernières vidéos sans filtre durée
    const searchRes = await youtube.search.list({
      key: apiKey,
      channelId,
      part: "snippet",
      order: "date",
      type: "video",
      maxResults: 50,
    });

    const items = searchRes.data.items || [];
    const videoIds = items.map((i) => i.id.videoId).join(",");

    // Étape 2 : récupère les durées réelles
    const detailsRes = await youtube.videos.list({
      key: apiKey,
      id: videoIds,
      part: "contentDetails,snippet",
    });

    const shorts = (detailsRes.data.items || [])
      .filter((v) => parseDuration(v.contentDetails.duration) < 240) // < 4 min
      .slice(0, 20)
      .map((v) => ({
        id: v.id,
        title: v.snippet.title,
        thumbnail: v.snippet.thumbnails?.high?.url || v.snippet.thumbnails?.default?.url,
        publishedAt: v.snippet.publishedAt,
        url: `https://www.youtube.com/shorts/${v.id}`,
      }));

    cache.short = { data: shorts, fetchedAt: now };
    res.json(shorts);
  } catch (err) {
    console.error("[YT] Error fetching shorts:", err.message || err);
    res.status(500).json({ error: "Failed to fetch YouTube shorts" });
  }
});

export default router;
