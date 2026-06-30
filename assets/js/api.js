/**
 * ScoreBadhao API Connector
 * All frontend calls must go through this file.
 */

const ScoreAPI = (() => {
  const cache = new Map();

  async function call(action, payload = {}, options = {}) {
    if (!SCOREBADHAO_CONFIG.API_URL || SCOREBADHAO_CONFIG.API_URL.includes("PASTE_")) {
      Toast.error("Please paste Apps Script Web App URL in assets/js/config.js");
      throw new Error("Missing API URL");
    }

    const cacheKey = action + JSON.stringify(payload);
    if (options.cache && cache.has(cacheKey)) {
      const entry = cache.get(cacheKey);
      if (Date.now() - entry.time < SCOREBADHAO_CONFIG.CACHE_TTL_MS) {
        return entry.data;
      }
    }

    const res = await fetch(SCOREBADHAO_CONFIG.API_URL, {
      method: "POST",
      body: JSON.stringify({ action, ...payload })
    });

    const data = await res.json();

    if (!data.ok) {
      throw new Error(data.error || "API error");
    }

    if (options.cache) {
      cache.set(cacheKey, { time: Date.now(), data });
    }

    return data;
  }

  return { call };
})();
