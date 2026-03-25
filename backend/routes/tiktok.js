import express from "express";

const router = express.Router();

const CACHE_TTL = 60 * 60 * 1000; // 1 heure
const cache = {};

const PROFILES = [
  { key: "lasweety_tiktok", username: "la.sweety" },
  { key: "diolinda_tiktok", username: "diolindaa_" },
];

async function fetchFollowers(username) {
  const res = await fetch(`https://www.tiktok.com/@${username}`, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "fr-FR,fr;q=0.9",
    },
  });

  console.log(`[TikTok] @${username} → HTTP ${res.status}`);
  const html = await res.text();
  console.log(`[TikTok] @${username} → HTML length: ${html.length}`);

  const match = html.match(
    /<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/
  );
  if (!match) {
    console.warn(`[TikTok] @${username} → script tag not found`);
    return null;
  }

  const data = JSON.parse(match[1]);
  const count =
    data?.["__DEFAULT_SCOPE__"]?.["webapp.user-detail"]?.userInfo?.stats
      ?.followerCount ?? null;

  console.log(`[TikTok] @${username} → followers: ${count}`);
  return count;
}

router.get("/subscribers", async (req, res) => {
  const now = Date.now();

  const results = await Promise.all(
    PROFILES.map(async ({ key, username }) => {
      if (cache[key] && now - cache[key].fetchedAt < CACHE_TTL) {
        return { key, username: `@${username}`, followers: cache[key].followers };
      }
      try {
        const followers = await fetchFollowers(username);
        cache[key] = { followers, fetchedAt: now };
        return { key, username: `@${username}`, followers };
      } catch (err) {
        console.error(`[TikTok] Erreur @${username}:`, err.message);
        return { key, username: `@${username}`, followers: null };
      }
    })
  );

  res.json(results);
});

export default router;
